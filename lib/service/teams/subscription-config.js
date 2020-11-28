exports.msalConfiguration = {
    authority: 'https://login.microsoftonline.com/common',
    clientID: '55a80a30-eea6-455a-929e-2e1a7b6cf8f3',
    clientSecret: '75s9.XIuc-.Lj_lPpy7~k~.Fz01n-UM7Fq',
    tenantID: '83fc36ba-9a7d-4694-86e1-5bd0ccca9023',
    redirectUri: 'http://localhost:55065/login'
  };
  
  exports.subscriptionConfiguration = {
    changeType: 'Created',
    notificationUrl: 'https://NGROK_ID.ngrok.io/listen',
    resource: 'me/mailFolders(\'Inbox\')/messages',
    clientState: 'cLIENTsTATEfORvALIDATION',
    includeResourceData: false
  };
  
  //this last config object will be used for creating certificates for HTTPS
  exports.certificateConfiguration = {
    certificateId: 'myCertificateId',
    relativeCertPath: './certificate.pem',
    relativeKeyPath: './key.pem',
    password: 'Password123',
  };