const axios = require("axios");
const EventEmitter = require('events');
const qs = require('qs');

/***
 * Putting client id here as a constant because this is not sensitive 
 * and it will be the same for all users of Lounge Lizard regardless
 * of what organization(s) they are connecting to.  Note that this will
 * need to be changed if the application is ever re-registered with 
 * Microsoft under a different organization.
 * 
 * Also note that though the redirect URI is not actually used in the
 * authentication flow, it is included in certain API calls and thus the
 * value defined here must match whatever is set in the app registrion
 * in Microsoft Azure.
 */
const authParameters = {
  clientId: '55a80a30-eea6-455a-929e-2e1a7b6cf8f3',
  redirectUri: 'http://localhost:55065/login'
}

// Need protocol here if using axios, do not need if using native Node.js https
const apiHost = "https://graph.microsoft.com"
const loginHost = "https://login.microsoftonline.com"

const apiPaths = {
  getChannelMessages: "/beta/teams/{{TeamId}}/channels/{{ChannelId}}/messages",
  getChannels: "/v1.0/teams/{{TeamId}}/channels",
  getChatMembers: "/beta/chats/{{ChatId}}/members",
  getChatMessages: "/beta/chats/{{ChatId}}/messages",
  getChats: "/beta/chats",
  getCurrentUser: "/v1.0/me",
  getTeamMembers: "/v1.0/groups/{{TeamId}}/members",
  getUser: "/v1.0/users/{{UserId}}",
  sendChannelMessage: "/beta/teams/{{TeamId}}/channels/{{ChannelId}}/messages"
}

const loginPaths = {
  deviceAuthorizationRequest: "/{{TenantID}}/oauth2/v2.0/devicecode",
  getAccessToken: "/{{TenantID}}/oauth2/v2.0/token",

}

const events = {
  TEST_EVENT: 'test_event',
  TEST_EVENT_WITH_PARAM: 'test_event_with_param',
  MESSAGE: 'message'
};

const TestData = require('./testdata.json')

class TeamsApiHelper {
  constructor(tenantId, refreshToken) {

    this.tenantId = tenantId
    this.refreshToken = refreshToken

    this.accessToken = ''

    // The Slack RTM client extends a third-party event emitter class which 
    // uses the same interface/API as the built-in Node.js event emitter.
    // For now we are going to assume that we only need to access event 
    // emitter functionality (other than the "on" method) from within this
    // class so we will just create an instance here to use (as opposed to
    // having this class extend an event emitter class).  We will also, for
    // now, assume that the standard Node.js event emitter will serve our 
    // purposes just fine, but it should always be possible to easily 
    // switch to the event emitter that the slack client uses (https://github.com/primus/eventemitter3)
    // if that proves not to be the case.  Another option would be to use MiniSignal which is already
    // used elsewhere in this project.
    this.eventEmitter = new EventEmitter();

    // Temporary
    this.initStaticData();
  }

  get events() {
    return events
  }

  /*****
   * Wrapper function that allows consumers to register event handlers for events 
   * that this class will raise
   */
  on(event, func) {
    this.eventEmitter.on(event, func);  
  }

  async getChannels(teamId) {
    const path = apiPaths.getChannels.replace("{{TeamId}}", teamId);
    const response = await this.invokeTeamsApi(path, 'get');
    return response.value ? response.value : [];
  }

  // This will eventually become part of the flow for adding a new account
  // to the application
  async getDeviceCode() {
    /***
     * TODO (fall2020):
     * The tenant used below for the device code auth flow is "organizations".  It can
     * also be "common", "consumers", or an individual tenant id.  We need to figure 
     * out what the ramifications are of using different tenant ids here.
     */
    const path = loginPaths.deviceAuthorizationRequest.replace("{{TenantID}}", "organizations")

    /***
     * TODO (fall2020):
     * Need to figure out best values to send for "scope" here
     * See https://docs.microsoft.com/en-us/graph/permissions-reference
     */
    const options = {
      baseURL: loginHost,
      url: path,
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify({
        client_id: authParameters.clientId,
        scope: 'user.read offline_access openid profile email chat.readwrite'
      })
    }

    const response = await axios(options)
      .catch(error => console.log(error));

    console.log(response.data)

    this.deviceCode = response.data.device_code
    // save interval from response here and use as polling interval while
    // waiting for user to log in and authorize device code

    setTimeout(this.getAuthTokenFromDeviceCode.bind(this), 30000)

    return response.data;
  }

  // This will eventually become part of the flow for adding a new account
  // to the application
  async getAuthTokenFromDeviceCode() {
    /***
     * TODO (fall2020):
     * The tenant used below for the device code auth flow is "organizations".  It can
     * also be "common", "consumers", or an individual tenant id.  We need to figure 
     * out what the ramifications are of using different tenant ids here.
     */
    const path = loginPaths.getAccessToken.replace("{{TenantID}}", "organizations")

    const options = {
      baseURL: loginHost,
      url: path,
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify({
        client_id: authParameters.clientId,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        code: this.deviceCode
      })
    }

    const response = await axios(options)
      .catch(error => console.log(error));

    // if response status is 400 and response.data.error = 'authorization_pending', 
    // need to wait the interval defined by the first request and then try again

    console.log(response.data)

    return response.data;
  }

  async getAccessToken() {
    /***
     * TODO (fall2020):
     * The tenant used below for the device code auth flow is "common".  It can
     * also be "organizations", "consumers", or an individual tenant id.  We need to figure 
     * out what the ramifications are of using different tenant ids here.
     */
    const path = loginPaths.getAccessToken.replace("{{TenantID}}", "common")

    const options = {
      baseURL: loginHost,
      url: path,
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify({
        client_id: authParameters.clientId,
        redirect_uri: authParameters.redirectUri,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      })
    }

    const response = await axios(options)
      .catch(error => console.log(error));    

    return response.data;
  }

  // Sample response from https://docs.microsoft.com/en-us/graph/api/channel-list-messages?view=graph-rest-beta&tabs=http
  async getChannelMessages(teamId, channelId) {
    const path = apiPaths.getChannelMessages.replace("{{TeamId}}", teamId).replace("{{ChannelId}}", channelId);
    const response = await this.invokeTeamsApi(path, 'get');
    return response && response.value ? response.value : [];
  }

  /***
   * See https://docs.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-beta&tabs=http
   */
  async getChats() {
    const path = apiPaths.getChats
    const response = await this.invokeTeamsApi(path, 'get')
    return response && response.value ? response.value : []
  }

  /***
   * See https://docs.microsoft.com/en-us/graph/api/conversationmember-list?view=graph-rest-beta&tabs=http
   */
  async getChatMembers(chatId) {
    const path = apiPaths.getChatMembers.replace("{{ChatId}}", chatId)
    const response = await this.invokeTeamsApi(path, 'get')
    return response && response.value ? response.value : []
  }

  /***
   * See https://docs.microsoft.com/en-us/graph/api/chat-list-message?view=graph-rest-beta&tabs=http
   */
  async getChatMessages(chatId) {
    const path = apiPaths.getChatMessages.replace("{{ChatId}}", chatId)
    const response = await this.invokeTeamsApi(path, 'get')
    return response && response.value ? response.value : []
  }

  async getCurrentUser() {
    const response = await this.invokeTeamsApi(apiPaths.getCurrentUser, 'get');
    return response;
  }

  async getTeamMembers(teamId) {
    const path = apiPaths.getTeamMembers.replace("{{TeamId}}", teamId);
    const response = await this.invokeTeamsApi(path, 'get');
    return response.value ? response.value : [];
  }

  async getThreadMessages(teamId, channelId, threadId) {
    /***
     * TODO (fall2020): 
     * Change this to do its own thing.  For right now it is just
     * returing our hard-coded list of messages
     */

    // Use this pattern for situations where this class needs to initiate some
    // action by raising an event.  An example would be a situation where this
    // class is polling for new messages and one has arrived.
    this.eventEmitter.emit(this.events.TEST_EVENT, 42);
    this.eventEmitter.emit(this.events.TEST_EVENT_WITH_PARAM, 99);

    return this.messages;
  }

  async getUser(userid) {
    const path = apiPaths.getUser.replace("{{UserId}}", userid);
    const response = await this.invokeTeamsApi(path, 'get');
    return response;
  }

  async sendChannelMessage(teamId, channelId, message) {
    const path = apiPaths.sendChannelMessage.replace("{{TeamId}}", teamId).replace("{{ChannelId}}", channelId)
    const data = {
      "body": {
        "content": message
      }
    }

    const response = await this.invokeTeamsApi(path, 'post', data)
    return response
  }

  async sendChatMessage(chatId, senderId, senderName, message) {

    // This is what the actual API response will look like
    // const response = {
    //   id: "id-value",
    //   replyToId: "replyToId-value",
    //   from: {
    //     application: null,
    //     device: null,
    //     user: {
    //       id: senderId,
    //       displayName: senderName
    //     }
    //   },
    //   messageType: "message",
    //   body: {
    //      content: message,
    //    contentType: "text"
    //   }
    // };

    const transformedResponse = this.createMockMessage(senderId, senderName, message)

    this.messages.push(transformedResponse);

    // This should return a transformed response that has the same appearance
    // as the response for getChannelMessages.
    return transformedResponse;
  }

  async invokeTeamsApi(path, method, data) {
    /***
     * TODO (fall2020):
     * Handle scenario where access token has expired
     */

    // If access token is blank or has expired, the first thing
    // we need to do is get a new access token
    if (!this.accessToken || this.accessToken === '') {
      const response = await this.getAccessToken()
      this.accessToken = response.access_token
    }

    const options = {
      baseURL: apiHost,
      url: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + this.accessToken,
        'SdkVersion': 'postman-graph/v1.0'
      },
      data: data
    }
  
    const response = await axios(options)
      .catch(error => {
        // Could log more info here if that became useful, but for now this seems to get 
        // what we most urgently need to know.
        if (error.config) {
          console.log(`URL: ${error.config.url}`)
        }
        if (error.response) {
          console.log(`Response status: ${error.response.status} ${error.response.statusText}`)
        }
        console.log(error.stack)
      });
  
    return response ? response.data : null;
  }

  // Just used to initialize some static data that we will use until we have Graph API fully functioal
  initStaticData() {

     /***
      * Begin initialization of messages
      */
    this.messages = [
      {
          "id": "1555375673184",
          "replyToId": null,
          "etag": "1555375673184",
          "messageType": "message",
          "createdDateTime": "2019-04-16T00:47:53.184Z",
          "lastModifiedDateTime": "2019-05-04T19:58:15.511Z",
          "lastEditedDateTime": null,
          "deletedDateTime": null,
          "subject": "",
          "summary": null,
          "importance": "normal",
          "locale": "en-us",
          "policyViolation": null,
          "from": {
              "application": null,
              "device": null,
              "conversation": null,
              "user": {
                  "id": "bb8775a4-4d8c-42cf-a1d4-4d58c2bb668f",
                  "displayName": "Adele Vance",
                  "userIdentityType": "aadUser"
              }
          },
          "body": {
              "contentType": "html",
              "content": "<div><div>Nice to join this team. <at id=\"0\">Megan Bowen</at>, have we got the March report ready please?</div>\n</div>"
          },
          "attachments": [],
          "mentions": [
              {
                  "id": 0,
                  "mentionText": "Megan Bowen",
                  "mentioned": {
                      "application": null,
                      "device": null,
                      "conversation": null,
                      "user": {
                          "id": "5d8d505c-864f-4804-88c7-4583c966cde8",
                          "displayName": "Megan Bowen",
                          "userIdentityType": "aadUser"
                      }
                  }
              }
          ],
          "reactions": []
      },
      {
          "id": "1548100551644",
          "replyToId": null,
          "etag": "1548100551893",
          "messageType": "message",
          "createdDateTime": "2019-01-21T19:55:51.644Z",
          "lastModifiedDateTime": "2019-05-04T19:58:15.511Z",
          "lastEditedDateTime": null,
          "deletedDateTime": null,
          "subject": "",
          "summary": null,
          "importance": "normal",
          "locale": "en-us",
          "policyViolation": null,
          "from": {
              "application": null,
              "device": null,
              "conversation": null,
              "user": {
                  "id": "c651e5be-7631-42ad-99c6-12c59def11fb",
                  "displayName": "Miriam Graham",
                  "userIdentityType": "aadUser"
              }
          },
          "body": {
              "contentType": "html",
              "content": "<div>I've added an Excel tab to the channel containing the P&amp;L Summary. \r\n<div style=\"display:inline\"><at id=\"0\">Isaiah Langer</at></div> and team, please review the Sale Summary tab in particular, and make any necessary updates.</div>"
          },
          "attachments": [],
          "mentions": [
              {
                  "id": 0,
                  "mentionText": "Isaiah Langer",
                  "mentioned": {
                      "application": null,
                      "device": null,
                      "conversation": null,
                      "user": {
                          "id": "b525e831-bd00-45e5-860c-a4329ef5f5d8",
                          "displayName": "Isaiah Langer",
                          "userIdentityType": "aadUser"
                      }
                  }
              }
          ],
          "reactions": [
              {
                  "reactionType": "like",
                  "createdDateTime": "2019-01-21T19:55:51.893Z",
                  "user": {
                      "application": null,
                      "device": null,
                      "conversation": null,
                      "user": {
                          "id": "e1ecb745-c10f-40af-a9d4-cab946c80ac7",
                          "displayName": null,
                          "userIdentityType": "aadUser"
                      }
                  }
              }
          ]
      },
      {
          "id": "1548100547534",
          "replyToId": null,
          "etag": "1548100547534",
          "messageType": "message",
          "createdDateTime": "2019-01-21T19:55:47.534Z",
          "lastModifiedDateTime": "2019-05-04T19:58:15.511Z",
          "lastEditedDateTime": null,
          "deletedDateTime": null,
          "subject": "",
          "summary": null,
          "importance": "high",
          "locale": "en-us",
          "policyViolation": null,
          "from": {
              "application": null,
              "device": null,
              "conversation": null,
              "user": {
                  "id": "bb8775a4-4d8c-42cf-a1d4-4d58c2bb668f",
                  "displayName": "Adele Vance",
                  "userIdentityType": "aadUser"
              }
          },
          "body": {
              "contentType": "html",
              "content": "<div>Just a reminder to everyone to please update your monthly reports by this Friday!</div>"
          },
          "attachments": [],
          "mentions": [],
          "reactions": []
      }
    ];
    /***
     * End initialization of messages
     */

     /***
      * Set up timer that will randomly "receive" mock messages
      */
      setTimeout(this.handleMessageTimer.bind(this), 5000)
      /***
       * End of timer setup
       */
  }

  createMockMessage(senderId, senderName, message) {
    return {
      "id": Date.now().toString(),
      "replyToId": null,
      "etag": Date.now().toString(),
      "messageType": "message",
      "createdDateTime": (new Date()).toISOString(),
      "lastModifiedDateTime": (new Date()).toISOString(),
      "lastEditedDateTime": null,
      "deletedDateTime": null,
      "subject": "",
      "summary": null,
      "importance": "high",
      "locale": "en-us",
      "policyViolation": null,
      "from": {
          "application": null,
          "device": null,
          "conversation": null,
          "user": {
              "id": senderId,
              "displayName": senderName,
              "userIdentityType": "aadUser"
          }
      },
      "body": {
          "contentType": "text",
          "content": message
      },
      "attachments": [],
      "mentions": [],
      "reactions": []
    };
  }

  generateRandomMessage() {
    const messageText = "This is a generated message created at " + (new Date()).toString()
    const senderId = "1f5cc7de-24db-412e-98cd-984f33ab2f9e"
    const senderName = "Teammate, James"
    const message = this.createMockMessage(senderId, senderName, messageText)
    return message
  }

  handleMessageTimer() {
    if (this.messages) {
      if (!this.generatedMessageCounter) {
        this.generatedMessageCounter = 0
      }
      this.generatedMessageCounter++
      
      // Alternate between creating a channel message and a direct message
      const channelId = this.generatedMessageCounter % 2 === 0 ? 
        TestData.channelId :
        "19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_877192bd-9183-47d3-a74c-8aa0426716cf@unq.gbl.spaces"

      // Generate two messages - one in a channel and one direct message
      const newMessage = this.generateRandomMessage()
      this.messages.push(newMessage)

      this.eventEmitter.emit(this.events.MESSAGE, {
        type: "message_received",
        channel: channelId, 
        message: newMessage
      });
    }
    setTimeout(this.handleMessageTimer.bind(this), 10000)
  }
}

module.exports = TeamsApiHelper