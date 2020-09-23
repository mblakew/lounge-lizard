const axios = require("axios");

// Need protocol here if using axios, do not need if using native Node.js https
const apiHost = "https://graph.microsoft.com"

const getChannelsPath = "/v1.0/teams/{{TeamId}}/channels";

class TeamsApiHelper {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  async getChannels(teamId) {

    const path = getChannelsPath.replace("{{TeamId}}", teamId);

    const response = await this.invokeTeamsApi(path, 'get');

    return response.value ? response.value : [];
  }

  async invokeTeamsApi(path, method) {
    const options = {
      baseURL: apiHost,
      url: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + this.accessToken,
        'SdkVersion': 'postman-graph/v1.0'
      }
    }
  
    //TODO: Need to handle errors a bit better here... a good way
    //      to cause an error to check behavior is by setting accessToken
    //      to an empty string above.
    const response = await axios(options)
      .catch(error => console.log(error));
  
    return response.data;
  }
}

module.exports = TeamsApiHelper