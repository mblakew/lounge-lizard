require('cross-fetch/polyfill')
const MicrosoftGraph = require('@microsoft/microsoft-graph-client')

class SubscriptionManager {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.subscriptionPath = '/subscriptions';
  }

  getGraphClient() {
    const client = MicrosoftGraph.Client.init({
      authProvider: (done) => {
        done(null, this.accessToken);
      }
    });
    return client;
  }

  async createSubscription(subscriptionCreationInformation) {
    const client = this.getGraphClient();
    const subscription = await client.api(this.subscriptionPath).version('beta').create(subscriptionCreationInformation);
    return subscription;
  }
  
  async deleteSubscription(subscriptionId) {
    const client = this.getGraphClient();
    await client.api('${this.subscriptionPath}/${subscriptionId}').delete();
  } 
 
}

module.exports = SubscriptionManager;