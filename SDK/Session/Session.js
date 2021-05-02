var lConfig = require('./../../config');
var bcrypt = require('bcryptjs');
var CryptoJS = require("crypto-js");
const crypto = require('crypto');
var Q = require('q');
var moment = require('moment'); // require


var lRedis = global.redis;

function Session()
{
    this.generateSalt = function()
    {
        var lDefered = Q.defer();

        bcrypt.genSalt(10, function(pError, pSalt)
        {
            var lBuffer = Buffer.alloc(pSalt.length, pSalt).toString('hex');
            lDefered.resolve(lBuffer);
        });

        return lDefered.promise;
    }

    this.logConnection = function(pUsername, pRemoteAddr, pStatus , pContext)
    {
        var lApp = pContext.app;
        lApp.database.query("INSERT INTO connection_logs(username, remote_addr, timestamp, status) VALUES ($1, $2, NOW(), $3)", [pUsername, pRemoteAddr, pStatus]);
    }

    this.checkCredential = function(pUsername, pPassword, pPayload, pContext)
    {
        var lDefered = Q.defer();

        var lBytes = CryptoJS.AES.decrypt(pPassword, pPayload);
        var lPassword = lBytes.toString(CryptoJS.enc.Utf8);

        if(!lPassword || lPassword.indexOf('password') === -1)
            lDefered.reject();

        lPassword = JSON.parse(lPassword).password;

        var lHashedPassword = crypto.createHash('sha256').update(pUsername + ':' + lPassword + ':' + lConfig.SESSION.password_salt).digest('hex').toString();
        var lApp = pContext.app;

        lApp.database.query("SELECT * FROM accounts WHERE username = $1 AND password = '"+lHashedPassword+"' AND enabled = true", [pUsername]).then((pResult) => 
        {
            if(!pResult || !pResult.rowCount)
            {
                this.logConnection(pUsername, this.getRemoteAddr(pContext.request), "FAILED", pContext);
                lDefered.resolve({state : false});
                return;
            }

            var lAccount = pResult.rows[0];

            lApp.database.query("UPDATE accounts SET last_ip = $1, last_connection = NOW() WHERE id = $2", [this.getRemoteAddr(pContext.request), lAccount.id]);
            this.logConnection(pUsername, this.getRemoteAddr(pContext.request), "SUCCESS", pContext);

            lDefered.resolve({state : true, account : lAccount});
        
        }).catch((pError) => {
            console.log("ERROR : ", pError);
        });

        return lDefered.promise;
    }

    this.getRemoteAddr = function(pRequest)
    {
        if('headers' in pRequest)
        {
            if(!('remote_addr' in pRequest.headers))
                pRequest.headers['remote_addr'] = '127.0.0.1';
            
            return pRequest.headers.remote_addr;
        }

        return "127.0.0.1";
    }

    this.storeSession = function(pData, pContext)
    {
        var lSessionID = crypto.randomBytes(32).toString('hex');
        var lRemoteAddr = this.getRemoteAddr(pContext.request);

        var lSessionData = {data : pData, remote_addr : lRemoteAddr, created_time : moment().valueOf()};

        lRedis.set('SESSION_'+lSessionID, JSON.stringify(lSessionData), lConfig.SESSION.expire);

        return lSessionID;
    }

    this.getSession = function(pSessionID, pContext)
    {
        var lDefered = Q.defer();

        lRedis.get("SESSION_" + pSessionID).then((pResult) =>
        {

            if(!pResult)
            {
                lDefered.resolve({state : false});
                return;
            }

            var lSessionData = JSON.parse(pResult);

            if(!('data' in lSessionData))
            {
                lDefered.resolve({state: false});
                return;
            }

            if(lSessionData.data.last_ip != this.getRemoteAddr(pContext))
            {
                lDefered.resolve({state: false});
                return;
            }

            lDefered.resolve({state: true, session: lSessionData.data})
        });

        return lDefered.promise;
    }
};

module.exports = new Session;
