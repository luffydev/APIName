const Q = require('q');


function PgHelper()
{
    var mPoolPtr = null;

    this.connect = function(pHost, pUser, pPassword, pDatabase, pPort)
    {
        const { Pool } = require('pg');

        mPoolPtr = new Pool({
            host: pHost,
            user: pUser,
            password: pPassword,
            database: pDatabase,
            port: pPort
        });
    };

    this.query = function(pQuery, pValue)
    {
        var lDefered = Q.defer();

        if(!mPoolPtr)
            lDefered.reject("Connection not initialized");
        else
        {
            mPoolPtr.query(pQuery, pValue, function(pError, pRes)
            {                
                if(typeof pRes != 'undefined')
                    pRes['current_query'] = pQuery;

                if(pError)
                {
                    console.log(pError);
                    lDefered.reject("Invalid request, ", pError);
                }
                else
                    lDefered.resolve(pRes);
            });
        }

        return lDefered.promise;
    };

    this.close = function()
    {
        if(mPoolPtr != null)
            mPoolPtr.close();
    }
}

module.exports = new PgHelper;