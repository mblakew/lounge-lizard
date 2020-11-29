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
    
    // obtain application access token
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
