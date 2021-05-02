var lAPP = null;
const expressAPI = require('express');
var lConfig = require('./../config');
var bodyParser = require('body-parser');
const WhatsApp = require('./../SDK/WhatsApp/WhatsApp');
const Session = require('./../SDK/Session/Session');
var JsonWebToken = require('jsonwebtoken');

function getDatabaseFromLocalization(pLocate)
{
    switch(pLocate.toLowerCase())
    {

        case 'uk':
            return 'uk';
        break;

        case 'spain':
            return 'spain';
        break;

        case 'france':
        default:
            return 'france_2';
        break;
    }
}

function StoreCurrentQuery(pQuery, pResult, pTable)
{
    lAPP.database.query("INSERT INTO request_history VALUES( nextval('request_history_id_seq'::regclass), $1, $2, $3 );",
                         [pQuery, pTable, JSON.stringify(pResult)]);
}

function sendClientPayload(pRes)
{
    Session.generateSalt().then(( pPayload ) => {        
        pRes.status(200).send(JSON.stringify({'success' : false, 'payload' : pPayload}));
    });
}

function initRoutes()
{

    /*
        SESSION HANDLER
    */

    lAPP.post('/API/checkSession', (pRequest, pRes) =>
    {
        if('session' in pRequest.body)
        {
            var lSession = pRequest.body.session;
            var lContext = { request : pRequest, app : lAPP };

            lSession = JsonWebToken.decode(lSession, lConfig.SESSION.encrypt_key);

            if(lSession && 'session' in lSession)
            {
                Session.getSession(lSession.session, lContext).then((pResult) => 
                {
                    if(!pResult.state)
                    {
                        sendClientPayload(pRes);
                        return;

                    }else
                    {
                        pRes.status(200).send(JSON.stringify({success : true}));
                        return;
                    }
                })
            }else
                sendClientPayload(pRes);
        }else
            sendClientPayload(pRes);
        
       
    });

    lAPP.post('/API/sendCredential', (pRequest, pRes) => {

        if(!('username' in pRequest.body) || !('password' in pRequest.body) || !('payload' in pRequest.body))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request'}));
            return;
        }

        var lUsername = pRequest.body.username;
        var lPassword = pRequest.body.password;
        var lPayload = pRequest.body.payload;

        lPassword = new Buffer(lPassword, 'hex').toString('utf8');
        lPayload = new Buffer(lPayload, 'hex').toString('utf8');

        var lContext = { request : pRequest, app : lAPP };

        Session.checkCredential(lUsername, lPassword, lPayload, lContext).then((pResult) => 
        {
            var lState = pResult.state;

            if(!lState)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'invalid credentials'}));
                return;
            }

            var lAccountData = pResult.account;

            var lSessionID = Session.storeSession(lAccountData, lContext);

            var lSessionToken = JsonWebToken.sign(JSON.stringify({'session' : lSessionID}), lConfig.SESSION.encrypt_key);

            pRes.status(200).send(JSON.stringify({'success' : true, 'session_id' : lSessionToken}));
        });

    });

    lAPP.post('/API/heartbeatSession', (pRequest, pRes) =>
    {
        pRes.status(200).send(JSON.stringify({'success' : true}));
    });

    /* 
        GLOBAL API CALL
    */

    lAPP.post('/API/getByName', (pRequest, pRes) =>
    {
        if(!('nom' in pRequest.body) || !('from' in pRequest.body))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request'}));
            return;
        }

        var lStore = false;

        if('store' in pRequest.body && parseInt(pRequest.body.store) == 1)
            lStore = true;
        

        var lNom = pRequest.body.nom.toLowerCase();
        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        lAPP.database.query("SELECT * FROM "+ lFrom +" WHERE LOWER(nom) LIKE '%"+lNom+"%' ORDER BY id ASC").then(function(pResult)
        {
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

            if(lStore)
                StoreCurrentQuery(pResult.current_query, pResult.rows, lFrom);

            var lJson = {'success' : true, 'count' : pResult.rowCount};

            lJson['data'] = pResult.rows;

            pRes.status(200).send(JSON.stringify(lJson));
        });
    });

    lAPP.post('/API/getBySubName', (pRequest, pRes) =>
    {
        if(!('prenom' in pRequest.body) || !('from' in pRequest.body))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request'}));
            return;
        }

        var lStore = false;

        if('store' in pRequest.body && parseInt(pRequest.body.store) == 1)
            lStore = true;

        var lPrenom = pRequest.body.prenom;
        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        lAPP.database.query("SELECT * FROM "+ lFrom +" WHERE LOWER(prenom) LIKE '%"+lPrenom+"%' ORDER BY nom ASC ").then(function(pResult)
        {
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

            if(lStore)
                StoreCurrentQuery(pResult.current_query, pResult.rows, lFrom);

            var lJson = {'success' : true, 'count' : pResult.rowCount};

            lJson['data'] = pResult.rows;

            pRes.status(200).send(JSON.stringify(lJson));
        });
    });

    lAPP.post('/API/getByNameAndSubName', (pRequest, pRes) =>
    {
        if(!('prenom' in pRequest.body) && !('nom' in pRequest.body) || !('from' in pRequest.body))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request'}));
            return;
        }

        var lStore = false;

        if('store' in pRequest.body && parseInt(pRequest.body.store) == 1)
            lStore = true;

        var lPrenom = pRequest.body.prenom.toLowerCase();
        var lNom = pRequest.body.nom.toLowerCase();
        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        lAPP.database.query("SELECT * FROM "+ lFrom +" WHERE LOWER(nom) LIKE '%"+lNom+"%' AND LOWER(prenom) LIKE '%"+lPrenom+"%' ORDER BY nom ASC ").then(function(pResult)
        {
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

            if(lStore)
                StoreCurrentQuery(pResult.current_query, pResult.rows, lFrom);

            var lJson = {'success' : true, 'count' : pResult.rowCount};

            lJson['data'] = pResult.rows;

            pRes.status(200).send(JSON.stringify(lJson));
        });
    });

    lAPP.post('/API/getByNumber', (pRequest, pRes) =>
    {
        if(!('numero' in pRequest.body) || !('from' in pRequest.body))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request'}));
            return;
        }

        var lStore = false;

        if('store' in pRequest.body && parseInt(pRequest.body.store) == 1)
            lStore = true;

        var lNumber = pRequest.body.numero;
        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        lAPP.database.query("SELECT * FROM "+ lFrom +" WHERE LOWER(num) LIKE '%"+lNumber+"%' ORDER BY nom ASC ").then(function(pResult)
        {
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

            if(lStore)
                StoreCurrentQuery(pResult.current_query, pResult.rows, lFrom);

            var lJson = {'success' : true, 'count' : pResult.rowCount};

            lJson['data'] = pResult.rows;

            pRes.status(200).send(JSON.stringify(lJson));

        }).catch(function(pTest, pError)
        {
            console.log(pError);
        });
    });

    lAPP.post('/API/getStoredRequest', (pRequest, pRes) => 
    {
        lAPP.database.query("SELECT * FROM request_history").then( (pResult) => 
        {
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

            var lJson = {'success' : true, 'count' : pResult.rowCount, 'data' : pResult.rows};

            pRes.status(200).send(JSON.stringify(lJson));

        });
    });

    lAPP.post('/API/getWhatsAppStatus', (pRequest, pRes) =>
    {
        if(!('numero' in pRequest.body))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request'}));
            return;
        }

        var lNumber = pRequest.body.numero.replace(/\s/g, '');
        
        var lCode = lNumber.substring(0, 2);
        var lNumber = lNumber.substring(2);

        if(isNaN(parseInt(lCode)))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid number'}));
            return;
        }

        WhatsApp.getWhatsAppStatus(lCode, lNumber).then( (pResult) => 
        {
            
            if(!pResult)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'not found'}));
                return;
            }

            var lJson = {'success' : true};
            lJson['data'] = pResult;

            pRes.status(200).send(JSON.stringify(lJson));
        })
    });

    lAPP.post('/API/setFavorite', (pRequest, pRes) => {

        if(!('id' in pRequest.body) || !('from' in pRequest.body) || !('value' in pRequest.body))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request'}));
            return;
        }

        var lID = parseInt(pRequest.body.id);
        var lValue = (pRequest.body.value) == true;
        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        if(isNaN(lID))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request variables'}));
            return;
        }

        lAPP.database.query("UPDATE " + lFrom + " SET is_favorite = $1 WHERE id = $2", [lValue, lID]).then((pResult) => {          
        });

        pRes.status(200).send(JSON.stringify({'success' : true}));
    });

    lAPP.post('/API/loadFavorite', (pRequest, pRes) => {

        if(! ('from' in pRequest.body) )
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request'}));
            return;
        }

        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        lAPP.database.query("SELECT * FROM " + lFrom + " WHERE is_favorite = true ORDER BY id ASC").then((pResult) => {
            
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

            var lJson = {"success" : true, "count" : pResult.rowCount, "data" : pResult.rows};

            pRes.status(200).send(JSON.stringify(lJson));

            return;

        });

    });
}



module.exports = {
    init:function(pObject)
    {
        lAPP = pObject;

        lAPP.use(bodyParser.json()); // support json encoded bodies
        lAPP.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

        initRoutes();
    }
}