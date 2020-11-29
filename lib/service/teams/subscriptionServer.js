const express = require('express')
const https = require('http')
const ngrok = require('ngrok');
const SubscriptionManager = require('./SubscriptionManager')
const serverConfig = require('./subscription-config')
const accountManager = require('../../controller/account-manager')

const axios = require("axios");
const qs = require('qs');

const app = express()
const port = 8080

app.post('/', (req, res) => {
  
  if(req.query && req.query.validationToken) {
    //res.status(200).send(escape(req.query.validationToken))
    console.log('received validation token\n')
    res.status(200).send(req.query.validationToken)
  }
  else {

    /*
    for (let i = 0; i < req.body.value.length; i++) {
      console.log("Subscription ID: " + req.body.value[i].subscriptionId + '\n')
    }
    */
    console.log('NOTIFICATION RECEIVED \n\n')
    res.status(202).end()
    for (const a of accountManager.accounts) {
      if(a.service.id === 'teams') {
        a.reload()
      }
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  (async function() {
    const url = await ngrok.connect(port);
    console.log(url);

    serverConfig.subscriptionConfiguration.notificationUrl = url

    //Subscriptions require application permissions approved by an admin and also access to 
    //protected APIs
    
    

    /* obtain application access token
    const tenantID = serverConfig.appConfiguration.tenantID
    const urlRequested = '/83fc36ba-9a7d-4694-86e1-5bd0ccca9023/oauth2/v2.0/token'
    
    const options = {
      baseURL: 'https://login.microsoftonline.com',
      url: urlRequested,
      method: 'post',
      headers: {
        'Host': 'login.microsoftonline.com',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify({
        client_id: serverConfig.appConfiguration.clientID,
        scope: 'https://graph.microsoft.com/.default',
        client_secret: serverConfig.appConfiguration.clientSecret,
        grant_type: 'client_credentials'
      })
    }
    const response = await axios(options)
      .catch(error => console.log(error));

    const accessToken = response.data.access_token
    */

    const accessToken = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6Ikk0WnFNTms1R3lNUG0zZG9majhYYW92ZkNGQmdhREIwb2I1cFFyTS1VNnciLCJhbGciOiJSUzI1NiIsIng1dCI6ImtnMkxZczJUMENUaklmajRydDZKSXluZW4zOCIsImtpZCI6ImtnMkxZczJUMENUaklmajRydDZKSXluZW4zOCJ9.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC84M2ZjMzZiYS05YTdkLTQ2OTQtODZlMS01YmQwY2NjYTkwMjMvIiwiaWF0IjoxNjA2NjEwMzExLCJuYmYiOjE2MDY2MTAzMTEsImV4cCI6MTYwNjYxNDIxMSwiYWlvIjoiRTJSZ1lHQzE5TnU2N2x3ZjI2dy80YWFIcDFmV0F3QT0iLCJhcHBfZGlzcGxheW5hbWUiOiJTYW1wbGVBcHAiLCJhcHBpZCI6IjU1YTgwYTMwLWVlYTYtNDU1YS05MjllLTJlMWE3YjZjZjhmMyIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzgzZmMzNmJhLTlhN2QtNDY5NC04NmUxLTViZDBjY2NhOTAyMy8iLCJpZHR5cCI6ImFwcCIsIm9pZCI6IjA2OTA4YzVjLWMyYTMtNDM4Ni04MzYxLWY4OTUyOTgzZGQxYiIsInJoIjoiMC5BQUFBdWpiOGczMmFsRWFHNFZ2UXpNcVFJekFLcUZXbTdscEZrcDR1R250cy1QTjFBQUEuIiwicm9sZXMiOlsiQ2hhbm5lbC5EZWxldGUuQWxsIiwiVXNlci5SZWFkV3JpdGUuQWxsIiwiQ2hhbm5lbFNldHRpbmdzLlJlYWQuQWxsIiwiQ2hhbm5lbC5SZWFkQmFzaWMuQWxsIiwiR3JvdXAuUmVhZFdyaXRlLkFsbCIsIkNoYXRNZXNzYWdlLlJlYWQuQWxsIiwiQ2hhbm5lbE1lbWJlci5SZWFkLkFsbCIsIkNoYW5uZWxNZXNzYWdlLlJlYWQuQWxsIiwiQ2hhdC5SZWFkV3JpdGUuQWxsIiwiQ2hhbm5lbE1lc3NhZ2UuVXBkYXRlUG9saWN5VmlvbGF0aW9uLkFsbCIsIkNoYW5uZWxNZW1iZXIuUmVhZFdyaXRlLkFsbCIsIkNoYW5uZWxTZXR0aW5ncy5SZWFkV3JpdGUuQWxsIiwiQ2hhbm5lbC5DcmVhdGUiXSwic3ViIjoiMDY5MDhjNWMtYzJhMy00Mzg2LTgzNjEtZjg5NTI5ODNkZDFiIiwidGVuYW50X3JlZ2lvbl9zY29wZSI6Ik5BIiwidGlkIjoiODNmYzM2YmEtOWE3ZC00Njk0LTg2ZTEtNWJkMGNjY2E5MDIzIiwidXRpIjoic0UtbWg5WE5qRW1QbjJkRWNwQmlBUSIsInZlciI6IjEuMCIsInhtc190Y2R0IjoxNjAxNDQ3MTgxfQ.rQSCt_b1y_KcrK-Pkfb_f5savZBIbjIwtfpx_ZPmlGZZTXq93su64AORSUTmAmhJPn42jByDWPHmOgX-n5JwuBw36Zg41fF1RewE2L54xNzKY9zCPVbfgCjr7BwBgoetrJ9DAI-ZHmMUESzUuJZMP1j-S2wOQCUWmtQu6wfV_lqq7l1mG116oArQma1ngf3MFT9SW9RCIqa_dGAy2KXiEljTmdnP12OkaIrAsOgDW2y2H6p3AGXPHRhuSnXyfX44CEHb1ymLxKgBHrXYLWjzO8DTTqUFYNsoMJC7OqQGM-uGsyqSV-1NFM-mHeNHTCy51ZG1CF_9yO0N5bqIcrER5w'

    console.log('APP ACCESS TOKEN: ' + accessToken + '\n\n')

    
    serverConfig.subscriptionConfiguration.resource = '/teams/getAllMessages'
    const subResponse = await createSubscription(accessToken) 

    serverConfig.subscriptionConfiguration.resource = '/chats/getAllMessages'
    const subResponse2 = await createSubscription(accessToken) 
    

  })();
})


async function createSubscription(token) {
  // Request this subscription to expire one hour from now.
  // Note: 1 hour = 3600000 milliseconds
  serverConfig.subscriptionConfiguration.expirationDateTime = new Date(Date.now() + 3600000).toISOString();

  const subscriptionService = new SubscriptionManager(token);

  const subscriptionData = await subscriptionService.createSubscription(serverConfig.subscriptionConfiguration);

  subscriptionData.accessToken = token;

  return subscriptionData;
}
