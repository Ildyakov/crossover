# crossover
test task for interview

Real Work Assignment - Cloud Charging

Assignment instructions: Make a copy of this document in Google Docs and fill in the following sections.
Change the sharing settings so that anyone with the link can view the document. Delete the text in red once you are done filling in the sections.

Would you choose Redis or Memcached? Why?
On one hand Memcached is more simple and provide enough of features for our tasks (key-value data storage, partitioning, etc.)
And in basic state of these 2 APIs Memcached was 10-30% faster then Redis.
But Redis (except others like better clustering and scalability) have a killer-feature for our use-case:
redis can implement custom scripts which is very useful for this particular task.
So my Choise is Redis

What code and/or configuration changes did you perform? Why?
CONFIG - left it the same. for small data amounts there were no need to make any updates
NEW CODE
    Github - 
    Gdrive - 
the code for Redis had 2 major and 1 minor issue
minor
    ISSUE: "reset" function was creating only 1 account record
    PROBLEM: false-positive test results possible
    SOLUTION: updated to create 100 (and if needed easiely can be changed to any other)
major 1
    ISSUE: client to Redis was needed to be set in every API request
    PROBLEM: wasting time of every API request
    SOLUTION: client creation were moved to the general code to be implemented only once at build
major 2
    ISSUE: every api call was needed to proceed 1-2 Redis non-async actions ("GET + reject" OR "GET + SET")
    PROBLEM: unnesessary Redis calls takes time
    SOLUTION: implemented custom Redis-lua script to take a key, a charge, compare value of key with charge and resolve SET/NO SET at once
        so now we have 0-1 calls of Redis on each request instead of 1-2

How did you verify your changes? 
when the manual API testing showed that everything is working well and looks faster I implemented the python test script to run many concurrent API requests
TEST SCRIPT CODE
    Github - 
    Gdrive - 
TEST CASE RESULTS 
    Github - 
    Gdrive - 
    
Given the Business Problem and the current implementation, what idea do you have to radically simplify the technical architecture?
the most valueble updates which can be done in this architecture:
    Redis is persistent. so in case if we use all it`s features we can use only it. with no other DB like DynamoDB or others.

Consider the specific use cases of text messaging and data usage. Are there any potential adjustments or modifications to the requirements that could radically simplify the solution while still delivering the core business value? Please explain your reasoning and discuss the potential trade-offs involved.
     possible option for optimization is letting the API Client on the front/mobile side know the exact balance of the Account. thus the comparing between amount to be charged and account balance can be operated on the front/mobile side.
     so every time if the API was requested we may be sure that the client was allowed to charge asked amount.
     and in that case we can charge from redis async == super fast for client.

Reminder: delete the ElasticCache resource from your AWS account once you complete this assignment.
