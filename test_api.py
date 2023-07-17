import aiohttp
import asyncio
import concurrent.futures
import time
import random


AWS_API_URI = '*****'
HEADERS = {"Content-Type":"application/json"}


async def send_post_request(payload, endpoint):
    url = f'{AWS_API_URI}/{endpoint}'
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=payload, headers=HEADERS) as response:
                #response.raise_for_status()
                return await response.json()
        except aiohttp.ClientError as error:
            print(f'Error: {error}')
            raise


async def run_concurrent_tasks(endpoint, services, is_empty):
    results = []

    async def task():
        if is_empty:
            payload = {}
        else:
            payload = {
                "accountId": random.randint(1,100),
                "serviceType": services[random.randint(0,1)]
            }
        start_time = time.time()
        await send_post_request(endpoint, payload)
        execution_time = time.time() - start_time
        results.append(execution_time)

    tasks = [task() for _ in range(1000)]

    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
        await asyncio.gather(*tasks)
    
    percentile = len(results)//10 + 1
    # returning the average value of execution time except top-10% and bottom-10%
    return sum(sorted(results)[percentile:len(results) - percentile]) / (len(results) - 2 * (percentile))


# reset the redis
payload = {}
endpoint = 'reset-redis'
response = await send_post_request(payload, endpoint)
print(response)

# run the API 1000 times
endpoint = 'charge-request-redis'
services = ('SMS', 'voice')
exec_time = await run_concurrent_tasks(endpoint, services, False)
print(f'average value of execution is {exec_time}')