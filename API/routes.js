var lAPP = null;
const expressAPI = require('express');
var lConfig = require('./../config');
var bodyParser = require('body-parser');

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

function initRoutes()
{
    lAPP.post('/API/getByName', (pRequest, pRes) =>
    {
        if(!('nom' in pRequest.body) || !('from' in pRequest.body))
        {
            pRes.status(400).send(JSON.stringify({'success' : false, 'error' : 'invalid request'}));
            return;
        }

        var lNom = pRequest.body.nom;
        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        lAPP.database.query("SELECT * FROM "+ lFrom +" WHERE LOWER(nom) LIKE '%"+lNom+"%'").then(function(pResult)
        {
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

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

        var lPrenom = pRequest.body.prenom;
        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        lAPP.database.query("SELECT * FROM "+ lFrom +" WHERE LOWER(prenom) LIKE '%"+lPrenom+"%'").then(function(pResult)
        {
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

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

        var lPrenom = pRequest.body.prenom;
        var lNom = pRequest.body.nom;
        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        lAPP.database.query("SELECT * FROM "+ lFrom +" WHERE LOWER(nom) LIKE '%"+lNom+"%' AND LOWER(prenom) LIKE '%"+lPrenom+"%' ").then(function(pResult)
        {
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

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

        var lNumber = pRequest.body.numero;
        var lFrom = getDatabaseFromLocalization(pRequest.body.from);

        lAPP.database.query("SELECT * FROM "+ lFrom +" WHERE LOWER(num) LIKE '%"+lNumber+"%'  ").then(function(pResult)
        {
            if(!pResult.rowCount)
            {
                pRes.status(404).send(JSON.stringify({'success' : false, 'error' : 'empty set'}));
                return;
            }

            var lJson = {'success' : true, 'count' : pResult.rowCount};

            lJson['data'] = pResult.rows;

            pRes.status(200).send(JSON.stringify(lJson));

        }).catch(function(pTest, pError)
        {
            console.log(pError);
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