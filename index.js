"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const util = require('util');
const NUM_ACCOUNTS = 100;
const DEFAULT_BALANCE = 100;
const redis = require('redis');
const redisClient = new redis.RedisClient({
    host: process.env.ENDPOINT,
    port: parseInt(process.env.PORT || "6379", 10),
});

const lua = `
  local current_val = tonumber(redis.call('get', KEYS[1]))

  if current_val == nil then
    return redis.error_reply("accountId does not exist")
  elseif current_val < tonumber(KEYS[2]) then
    return redis.error_reply("balance is not enough to proceed")
  else
    return redis.call('decrby', KEYS[1], KEYS[2])
  end
`;

let sha1;

redisClient.script('load', lua, (err, result) => {
  if (err) {
    console.error('Failed to load Lua script', err);
  } else {
    sha1 = result;
    console.log(`Lua script loaded with SHA1: ${sha1}`);
  }
});

exports.chargeRequestRedis = async function (input) {
    return new Promise((resolve, reject) => {
        var amount = parseInt(input.amount || "1", 10);
        var charges = getCharges(input.serviceType);
        if (!input.accountId) {
            resolve({
                isAuthorized: false,
                errorMsg: 'AccountId not specified'
            });
        }
        const accountId = `account${input.accountId}/balance`;
        
        redisClient.evalsha(sha1, 2, accountId, (charges*amount).toString(), (err, result) => {
            if (err) {
                reject(err);
            } else if (typeof result === 'string' && result.startsWith('ERR')) {
                resolve({
                    accountId,
                    isAuthorized: false,
                    errorMsg: result
                });
            } else {
                resolve({
                    accountId,
                    isAuthorized: true,
                    charge: charges*amount,
                    remainingBalance: result
                });
            }
        });
    });
};
function getCharges(serviceType) {
    if (serviceType == 'voice') {
        return 5;
    }
    return 1;
}
exports.resetRedis = async function () {
    for (let i = 1; i <= NUM_ACCOUNTS; i++) {
        const account = `account${i}/balance`;
        await util.promisify(redisClient.set).bind(redisClient).call(redisClient, account, DEFAULT_BALANCE);
    }
    return {
        result: `set ${NUM_ACCOUNTS} accounts balance`
    };
};