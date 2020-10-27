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

/***
 * TODO (fall2020):
 * In accordance with the REST paradigm, the paths for "send" and "get" of a given resource
 * are the same (see getChatMessages and sendChatMessages, for example) with the distinction
 * between sending and getting being determined by the http verb used for the API call.  
 * Considering this, it probably makes sense to change the paths constant below to just 
 * define each path once and to remove the verb from the name of each member of the constant.
 */
const apiPaths = {
  getChannelMessage: "/beta/teams/{{TeamId}}/channels/{{ChannelId}}/messages/{{MessageId}}",
  getChannelMessageReplies: "/beta/teams/{{TeamId}}/channels/{{ChannelId}}/messages/{{MessageId}}/replies",
  getChannelMessages: "/beta/teams/{{TeamId}}/channels/{{ChannelId}}/messages",
  getChannels: "/v1.0/teams/{{TeamId}}/channels",
  getChatMembers: "/beta/chats/{{ChatId}}/members",
  getChatMessages: "/beta/chats/{{ChatId}}/messages",
  getChats: "/beta/chats",
  getCurrentUser: "/v1.0/me",
  getTeamMembers: "/v1.0/groups/{{TeamId}}/members",
  getUser: "/v1.0/users/{{UserId}}",
  sendChannelMessage: "/beta/teams/{{TeamId}}/channels/{{ChannelId}}/messages",
  sendChannelMessageReply: "/beta/teams/{{TeamId}}/channels/{{ChannelId}}/messages/{{MessageId}}/replies",
  sendChatMessage: "/beta/chats/{{ChatId}}/messages"
}

const loginPaths = {
  deviceAuthorizationRequest: "/{{TenantID}}/oauth2/v2.0/devicecode",
  getAccessToken: "/{{TenantID}}/oauth2/v2.0/token",

}

// Use this pattern for situations where this class needs to initiate some
// action by raising an event.  An example would be a situation where this
// class is polling for new messages and one has arrived:
//
// async someMethod() {
//   this.eventEmitter.emit(this.events.TEST_EVENT, 42);
//   this.eventEmitter.emit(this.events.TEST_EVENT_WITH_PARAM, 99);
// }
const events = {
  TEST_EVENT: 'test_event',
  TEST_EVENT_WITH_PARAM: 'test_event_with_param',
  MESSAGE: 'message'
};

const TestData = require('./testdata.json')

class TeamsApiHelper {
  constructor(refreshToken) {

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

  /***
   * See https://docs.microsoft.com/en-us/graph/api/channel-list-messagereplies?view=graph-rest-beta&tabs=http
   */
  async getChannelMessageReplies(teamId, channelId, messageId) {
    const path = apiPaths.getChannelMessageReplies
      .replace("{{TeamId}}", teamId)
      .replace("{{ChannelId}}", channelId)
      .replace("{{MessageId}}", messageId)
    return await this.invokeTeamsApiGetCollection(path)  
  }

  // Sample response from https://docs.microsoft.com/en-us/graph/api/channel-list-messages?view=graph-rest-beta&tabs=http
  async getChannelMessages(teamId, channelId) {
    const path = apiPaths.getChannelMessages.replace("{{TeamId}}", teamId).replace("{{ChannelId}}", channelId);
    return await this.invokeTeamsApiGetCollection(path)
  }

  /***
   * See https://docs.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-beta&tabs=http
   */
  async getChats() {
    return await this.invokeTeamsApiGetCollection(apiPaths.getChats)
  }

  /***
   * See https://docs.microsoft.com/en-us/graph/api/conversationmember-list?view=graph-rest-beta&tabs=http
   */
  async getChatMembers(chatId) {
    const path = apiPaths.getChatMembers.replace("{{ChatId}}", chatId)
    return await this.invokeTeamsApiGetCollection(path)
  }

  /***
   * See https://docs.microsoft.com/en-us/graph/api/chat-list-message?view=graph-rest-beta&tabs=http
   */
  async getChatMessages(chatId) {
    const path = apiPaths.getChatMessages.replace("{{ChatId}}", chatId)
    return await this.invokeTeamsApiGetCollection(path)
  }

  async getCurrentUser() {
    const response = await this.invokeTeamsApi(apiPaths.getCurrentUser, 'get');
    return response;
  }

  async getTeamMembers(teamId) {
    const path = apiPaths.getTeamMembers.replace("{{TeamId}}", teamId)
    return await this.invokeTeamsApiGetCollection(path) 
  }

  async getUser(userid) {
    const path = apiPaths.getUser.replace("{{UserId}}", userid);
    const response = await this.invokeTeamsApi(path, 'get');
    return response;
  }

  /***
   * TODO (fall2020):
   * Add helper method to do path token replacement?
   */

  async sendMessage(path, message) {
    const data = {
      "body": {
        "content": message
      }
    }

    const response = await this.invokeTeamsApi(path, 'post', data)
    return response
  }

  async sendChannelMessage(teamId, channelId, message) {
    const path = apiPaths.sendChannelMessage.replace("{{TeamId}}", teamId).replace("{{ChannelId}}", channelId)
    return await this.sendMessage(path, message)
  }

  async sendChannelMessageReply(teamId, channelId, messageId, message) {
    const path = apiPaths.sendChannelMessageReply
      .replace("{{TeamId}}", teamId)
      .replace("{{ChannelId}}", channelId)
      .replace("{{MessageId}}", messageId)
    return await this.sendMessage(path, message)
  }

  async sendChatMessage(chatId, message) {
    const path = apiPaths.sendChatMessage.replace("{{ChatId}}", chatId)
    return await this.sendMessage(path, message)
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
      this.refreshToken = response.refresh_token

      /***
       * TODO (fall2020):
       * Set timer to clear access token shortly before it is scheduled to expire.
       * Use response.expires_in to determine when the access token will expire
       * (i.e. "expires_in": 3599), subtract some amount of time as a buffer (perhaps
       * 5 minutes or so), then multiply by 1000 to convert to milliseconds and use with 
       * setTimeout() function.
       */
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

  /***
   * Performs an http GET operation for the specified path.  Use with
   * resources that return a collection (array).
   */
  async invokeTeamsApiGetCollection(path) {
    const response = await this.invokeTeamsApi(path, 'get')
    return response && response.value ? response.value : []
  }

  // Just used to initialize some static data that we will use until we have Graph API fully functioal
  initStaticData() {
     /***
      * Set up timer that will randomly "receive" mock messages
      */
      setTimeout(this.handleMessageTimer.bind(this), 5000)
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
    const message = this.createMockMessage(TestData.mockMessageSenderId, TestData.mockMessageSenderName, messageText)
    return message
  }

  /***
   * Periodically generate mock received messages until we get this working with the actual Teams/Graph API
   */
  handleMessageTimer() {
    if (!this.generatedMessageCounter) {
      this.generatedMessageCounter = 0
    }
    this.generatedMessageCounter++
    
    // Alternate between creating a channel message and a direct message
    const channelId = this.generatedMessageCounter % 2 === 0 ? 
      TestData.channelId :
      TestData.chatId

    // Generate two messages - one in a channel and one direct message
    const newMessage = this.generateRandomMessage()

    this.eventEmitter.emit(this.events.MESSAGE, {
      channel: channelId, 
      message: newMessage
    });

    setTimeout(this.handleMessageTimer.bind(this), 10000)
  }
}

module.exports = TeamsApiHelper