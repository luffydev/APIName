const lCompression = require('compression');
var lConfig = require('./../config');
const expressAPI = require('express');
var jwt = require('jsonwebtoken');
const port = 35466;
var Routes = require('./routes');
var lCors = require('cors');

lAPP = expressAPI();

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
        pRes.setHeader("Access-Control-Allow-Origin", "*");
        pRes.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
        pRes.setHeader('X-Powered-By', 'Storme');
        pRes.setHeader('Content-Type', 'application/json');

        if(!pRequest.headers.authorization)
            return pRes.status(401).send(JSON.stringify({'error' : 'unauthorized'}));
        else
        {
            var lAuth = pRequest.headers.authorization.replace("Basic ", "");
            lAuthCookie = jwt.decode(lAuth.replace("Basic "), lConfig.SIGNED_COOKIE_SECRET);            

            if(!lAuthCookie || !('key' in lAuthCookie) || !(lConfig.API_KEYS.includes(lAuthCookie.key)) )
                pRes.status(401).send(JSON.stringify({'error' : 'unauthorized'}));
            else
                pNext();
        }
        
    }
}


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
