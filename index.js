const express = require('express');
const lTwig = require('twig');
const app = express();
const port = 35465;
const lFS = require('fs');
var path = require('path');

var API = require('./API/API');

API.init(app);


app.use(express.query());

app.set('views', path.join(__dirname, '/Templates'));
app.set('view engine', 'html');
app.engine('html', lTwig.__express);

app.get('/pages/:module', (pRequest, pRes) => {    

    let lModule = pRequest.params.module;
    let lPath = './Templates/' + lModule + '/index.twig';


    lFS.access(lPath, lFS.F_OK, (err) => {
      if (err) {
        console.error(err);
        console.log("UNABLE TO FIND MODULE : " + lPath + " SEND 404");
        return
      }
    
      console.log("LOADING MODULE : " + lPath);

      pRes.render(lModule + '/index.twig', {});

    })
});

app.listen(port, () => {
  console.log(`starting at port http://localhost:${port}`)
})
