var https = require('https');
var request = require('request');
var querystring = require('querystring');
var lConfig = require('../../config');
const Q = require('q');

function Whatsapp()
{
    this.getWhatsAppStatus = function(pCode, pNumber)
    {
        var lForm = {
            user : lConfig.WHATSAPP.user,
            apikey : lConfig.WHATSAPP.key,
            action : 'check', 
            num : pNumber,
            cod : pCode
        }

        lForm = JSON.stringify(lForm);
        var lLength = lForm.length;

        var lDefered = Q.defer();

        request({ 
            headers: {
                'Content-Length': lLength,
                'Content-Type': 'application/json'
            },

            uri: lConfig.WHATSAPP.url,
            body: lForm,
            method: 'POST'
            
        }, function(pErr, pRes, pBody)
        {

            if(!pBody || pErr)
            {
                lDefered.resolve(false);
                return;
            }

            var lBody = JSON.parse(pBody);

            if(!lBody || lBody.code != '001')
            {
                lDefered.resolve(false);
                return;
            }

            lDefered.resolve({lastSeen : lBody.lastseen, status : lBody.status, avatar : lBody.picture})
        });

        return lDefered.promise;
    }
}

module.exports = new Whatsapp;