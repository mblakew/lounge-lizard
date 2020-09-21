const axios = require("axios");

// Need protocol here if using axios, do not need if using native Node.js https
const apiHost = "https://graph.microsoft.com"

const getChannelsPath = "/v1.0/teams/{{TeamId}}/channels";

// Until we get the specifics of authentication sorted out, get an access token from
// Microsoft's Graph API explorer and paste it below.
const accessToken = "";

async function invokeTeamsApi(path, method) {
  const options = {
    baseURL: apiHost,
    url: path,
    method: method,
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'SdkVersion': 'postman-graph/v1.0'
    }
  }

  const response = await axios(options)
    .catch(error => console.log(error));

  return response.data;
}

class TeamsApiHelper {

  async getChannels(teamId) {

    const path = getChannelsPath.replace("{{TeamId}}", teamId);

    const response = await invokeTeamsApi(path, 'get');

    return response.value ? response.value : [];
  }
}

module.exports = TeamsApiHelper