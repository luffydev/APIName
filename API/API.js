var lAPP = null;
var lConfig = require('./../config');
const expressAPI = require('express');
var jwt = require('jsonwebtoken');
const port = 35466;
var Routes = require('./routes');

function initAPI()
{
    lAPP.use(expressAPI.query());

    lAPP.post('*', checkAPIKey);

    lAPP.listen(port, () => {
        console.log(`starting API at port http://localhost:${port}`)
    })

    function checkAPIKey(pRequest, pRes, pNext)
    {
        pRes.setHeader('X-Powered-By', 'Storm');

        var lCookies = readCookies(pRequest);

        if(!('auth' in lCookies))
            pRes.status(401).send(JSON.stringify({'error' : 'Failed auth'}));
        else
        {
            lAuthCookie = jwt.decode(lCookies['auth'], lConfig.SIGNED_COOKIE_SECRET);
            

            if(!('key' in lAuthCookie) || !(lConfig.API_KEYS.includes(lAuthCookie.key)) )
                pRes.status(401).send(JSON.stringify({'error' : 'Failed auth'}));
            else
                pNext();
        }
        
    }

    function readCookies(pRequest)
    {
        var lCookies = {};

        pRequest.headers && pRequest.headers.cookie.split(';').forEach(function(cookie) {

            var parts = cookie.match(/(.*?)=(.*)$/)
            lCookies[ parts[1].trim() ] = (parts[2] || '').trim();

          });

          return lCookies;
    }
}


module.exports = {
    init:function(pObject)
    {
        lAPP = pObject;

        lAPP.database = require('./../SDK/PgHelper/PgHelper');
        lAPP.database.connect(lConfig.POSTGRES.host, lConfig.POSTGRES.user, lConfig.POSTGRES.password, lConfig.POSTGRES.database, lConfig.POSTGRES.port);

        initAPI();
        Routes.init(lAPP);
    }
}
