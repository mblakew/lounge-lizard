const express = require('express')
const https = require('http')
const ngrok = require('ngrok');

const serverConfig = require('./subscription-config')

const app = express()
const port = 8080

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  (async function() {
    const url = await ngrok.connect(port);
    console.log(url);
  })();
})