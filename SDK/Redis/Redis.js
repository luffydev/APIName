
var Q = require('q');
const redis = require('redis');
var lConfig = require('../../config');

function Redis()
{
    var lRedisConfig = {host : lConfig.REDIS.host, port: lConfig.REDIS.port}

    if(lConfig.REDIS.password != "")
        lRedisConfig['password'] = lConfig.REDIS.password;

    this.mRedisClient = redis.createClient(lRedisConfig);
    this.mConnected = false;

    this.mRedisClient.on('error', function(pError)
    {
        this.mConnected = false;
        console.log('[REDIS] -> Unable to connect to redis server : ', pError);
        process.exit(1);
    });

    this.mRedisClient.on('ready', function()
    {
        console.log('[REDIS] -> connected to ', lConfig.REDIS.host,' on port ', lConfig.REDIS.port);
        this.mConnected = true;
    });

    this.isConnected = function()
    {
        return this.mConnected;
    }

    this.set = function(pKey, pValue, pExpire = null) 
    {
        if(pExpire != null)
            this.mRedisClient.set(pKey, pValue, 'EX', pExpire);
        else
            this.mRedisClient.set(pKey, pValue);
    }

    this.get = function(pKey)
    {
        var lDefer = Q.defer();
        
        this.mRedisClient
        this.mRedisClient.get(pKey, function(pError, pReply)
        {
            lDefer.resolve(pReply);
        })

        return lDefer.promise;
    }
}

module.exports = new Redis;