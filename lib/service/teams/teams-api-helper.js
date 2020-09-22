const axios = require("axios");

// Need protocol here if using axios, do not need if using native Node.js https
const apiHost = "https://graph.microsoft.com"

const getChannelsPath = "/v1.0/teams/{{TeamId}}/channels";

// Until we get the specifics of authentication sorted out, get an access token from
// Microsoft's Graph API explorer and paste it below.
const accessToken = "eyJ0eXAiOiJKV1QiLCJub25jZSI6ImduSWtUTUZPeHMyUWlTcGxaSDdmMGUzVXZJeXVFQlFWVUh3VGtLeGFtQWMiLCJhbGciOiJSUzI1NiIsIng1dCI6ImppYk5ia0ZTU2JteFBZck45Q0ZxUms0SzRndyIsImtpZCI6ImppYk5ia0ZTU2JteFBZck45Q0ZxUms0SzRndyJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8wZDRkYTBmOC00YTMxLTRkNzYtYWNlNi0wYTYyMzMxZTFiODQvIiwiaWF0IjoxNjAwNzc1NDMxLCJuYmYiOjE2MDA3NzU0MzEsImV4cCI6MTYwMDc3OTMzMSwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFTUUEyLzhRQUFBQUt2Y2VCaXM2bU1uSmFSQ0FhMVBlNXlXWWtNMnJWN1c2UmVWVDI1MmZraEE9IiwiYW1yIjpbInB3ZCJdLCJhcHBfZGlzcGxheW5hbWUiOiJHcmFwaCBleHBsb3JlciAob2ZmaWNpYWwgc2l0ZSkiLCJhcHBpZCI6ImRlOGJjOGI1LWQ5ZjktNDhiMS1hOGFkLWI3NDhkYTcyNTA2NCIsImFwcGlkYWNyIjoiMCIsImZhbWlseV9uYW1lIjoiWWVzdGUiLCJnaXZlbl9uYW1lIjoiTWF4IiwiaWR0eXAiOiJ1c2VyIiwiaXBhZGRyIjoiNzAuMTEzLjEyMC44NiIsIm5hbWUiOiJZZXN0ZSxNYXggVmluY2VudCIsIm9pZCI6IjI4MjVhYjc4LTI4YTUtNDg1Ni1iM2FiLTFhN2Q3ZWE2MDFkOSIsIm9ucHJlbV9zaWQiOiJTLTEtNS0yMS0xMzA4MjM3ODYwLTQxOTMzMTc1NTYtMzM2Nzg3NjQ2LTE3OTMzNCIsInBsYXRmIjoiMyIsInB1aWQiOiIxMDAzN0ZGRTg1ODM5ODMyIiwicmgiOiIwLkFBQUEtS0JORFRGS2RrMnM1Z3BpTXg0YmhMWElpOTc1MmJGSXFLMjNTTnB5VUdRMUFNNC4iLCJzY3AiOiJEaXJlY3RvcnkuUmVhZC5BbGwgb3BlbmlkIHByb2ZpbGUgVXNlci5SZWFkIGVtYWlsIiwic2lnbmluX3N0YXRlIjpbImttc2kiXSwic3ViIjoialpXRlp2bmhfV2RrWU14RGtGYUdLazRuN1NtQ2w3X05JdzY5YkpXbVlwdyIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJOQSIsInRpZCI6IjBkNGRhMGY4LTRhMzEtNGQ3Ni1hY2U2LTBhNjIzMzFlMWI4NCIsInVuaXF1ZV9uYW1lIjoibXJtdnlAdWZsLmVkdSIsInVwbiI6Im1ybXZ5QHVmbC5lZHUiLCJ1dGkiOiJwOXAwWl84cXdFdU1oR2dlQ0hPckFRIiwidmVyIjoiMS4wIiwid2lkcyI6WyJiNzlmYmY0ZC0zZWY5LTQ2ODktODE0My03NmIxOTRlODU1MDkiXSwieG1zX3N0Ijp7InN1YiI6IjZuT1dGZ1NzVkJXMU1adTZRTWdJeERWQlJLLXVIQzNRcGJ6czZ5SEUwVlkifSwieG1zX3RjZHQiOjEzNjQzMjY1OTB9.EhnOqS1p7rUruQGNHPseSDev3jdoZ1CmlIr6tM5j-oQBJKNVVFKLQvoiiUtZHbxWAFELBTwnfLKJVm_GwlZMungTjPU_WTh5eY3ivEnRxSwfOqyv9qXSBR74Xg5Uk0BiLDIfTEx0rN4BIbrjj3JJFQrWWjB7iYlQ1rx7u1gAY6yEssQCY3flZgwGppaiguSDbxMd2VtSs8Ht6_-raKp19It8DFz1ocFjkrv5K8tjZK94uJdDYecEVzxPASDA8sqZ9dnV_p8x8e59sAQdhHupiHW0NnT8JzYGvrJfJH1egsxouHQEcRiPyIPs8SweS8SPztHmGS0WyRFwfD7O-bl3rw";

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

  //TODO: Need to handle errors a bit better here... a good way
  //      to cause an error to check behavior is by setting accessToken
  //      to an empty string above.
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