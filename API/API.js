const lCompression = require('compression');
var lConfig = require('./../config');

global.redis = require('../SDK/Redis/Redis');

const Session = require('./../SDK/Session/Session');
const expressAPI = require('express');
var jwt = require('jsonwebtoken');
const port = 35466;
var Routes = require('./routes');
var lCors = require('cors');

lAPP = expressAPI();

function sendUnauthorized(pRes)
{
    return pRes.status(401).send(JSON.stringify({'error' : 'unauthorized'}));
}

function initAPI()
{
    lAPP.use(lCompression());
    lAPP.use(lCors());
    lAPP.use(expressAPI.query());

    lAPP.post('*', checkAPIKey);

    lAPP.listen(port, () => {
        console.log(`starting API at port http://localhost:${port}`)
    })

    function checkAPIKey(pRequest, pRes, pNext)
    {
        if(pRequest.path.indexOf("checkSession") != -1 || pRequest.path.indexOf("sendCredential") != -1)
        {
            pNext();
            return;
        }

        pRes.setHeader("Access-Control-Allow-Origin", "*");
        pRes.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
        pRes.setHeader('X-Powered-By', 'Storm');
        pRes.setHeader('Content-Type', 'application/json');

        if(!pRequest.headers.authorization)
            return sendUnauthorized(pRes);
        else
        {
            var lAuth = pRequest.headers.authorization.replace("Basic ", "");
            var lSession = jwt.decode(lAuth, lConfig.SESSION.encrypt_key);
            var lContext = { request : pRequest, app : lAPP };

            if('session' in lSession)
            {
                Session.getSession(lSession.session, lContext).then((pResult) => 
                {
                    if(pResult.state)
                        pNext();
                    else
                        sendUnauthorized(pRes);
                });
            }else
                sendUnauthorized(pRes);
        }

    }
}

/* OLD METHOD */


module.exports = {
    init:function(pObject)
    {
        if(lAPP == null)
            lAPP = pObject; 

        lAPP.database = require('./../SDK/PgHelper/PgHelper');
        lAPP.database.connect(lConfig.POSTGRES.host, lConfig.POSTGRES.user, lConfig.POSTGRES.password, lConfig.POSTGRES.database, lConfig.POSTGRES.port);

        initAPI();
        Routes.init(lAPP);
    }
}
