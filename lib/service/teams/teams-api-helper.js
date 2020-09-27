const axios = require("axios");
const EventEmitter = require('events');

// Need protocol here if using axios, do not need if using native Node.js https
const apiHost = "https://graph.microsoft.com"

const apiPaths = {
  getChannels: "/v1.0/teams/{{TeamId}}/channels",
  getCurrentUser: "v1.0/me",
  getTeamMembers: "/v1.0/groups/{{TeamId}}/members"
}

const events = {
  TEST_EVENT: 'test_event',
  TEST_EVENT_WITH_PARAM: 'test_event_with_param'
};

class TeamsApiHelper {
  constructor(accessToken) {
    this.accessToken = accessToken;

    // The Slack RTM client extends a third-party event emitter class which 
    // uses the same interface/API as the built-in Node.js event emitter.
    // For now we are going to assume that we only need to access event 
    // emitter functionality (other than the "on" method) from within this
    // class so we will just create an instance here to use (as opposed to
    // having this class extend an event emitter class).  We will also, for
    // now, assume that the standard Node.js event emitter will serve our 
    // purposes just fine, but it should always be possible to easily 
    // switch to the event emitter that the slack client uses (https://github.com/primus/eventemitter3)
    // if that proves not to be the case.
    this.eventEmitter = new EventEmitter();

    this.events = events;
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

  // Sample response from https://docs.microsoft.com/en-us/graph/api/channel-list-messages?view=graph-rest-beta&tabs=http
  async getChannelMessages(teamId, channelId) {
    const messages = [
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

    // Use this pattern for situations where this class needs to initiate some
    // action by raising an event.  An example would be a situation where this
    // class is polling for new messages and one has arrived.
    this.eventEmitter.emit(this.events.TEST_EVENT, 42);
    this.eventEmitter.emit(this.events.TEST_EVENT_WITH_PARAM, 99);
    
    return messages;
  }

  // Sample response from https://docs.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-beta&tabs=http
  async getChats() {
    const chats = [
      {
          "id": "19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_877192bd-9183-47d3-a74c-8aa0426716cf@unq.gbl.spaces",
          "topic": null,
          "createdDateTime": "2019-04-18T23:51:42.099Z",
          "lastUpdatedDateTime": "2019-04-18T23:51:43.255Z"
      },
      {
          "id": "19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_0c5cfdbb-596f-4d39-b557-5d9516c94107@unq.gbl.spaces",
          "topic": null,
          "createdDateTime": "2019-04-18T23:19:23.76Z",
          "lastUpdatedDateTime": "2019-04-18T23:19:21.994Z"
      },
      {
          "id": "19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_3ee373aa-62fa-4fc6-b11f-9627d5b4a73d@unq.gbl.spaces",
          "topic": null,
          "createdDateTime": "2019-03-21T22:30:14.867Z",
          "lastUpdatedDateTime": "2019-03-21T22:30:15.507Z"
      },
      {
          "id": "19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_90a27c51-5c74-453b-944a-134ba86da790@unq.gbl.spaces",
          "topic": null,
          "createdDateTime": "2019-02-06T03:38:58.062Z",
          "lastUpdatedDateTime": "2019-02-06T03:38:58.063Z"
      }
    ];
    return chats;
  }

  // Sample response from https://docs.microsoft.com/en-us/graph/api/conversationmember-list?view=graph-rest-beta&tabs=http
  async getChatMembers(chatId) {
    // Let's make one of them a multi-party chat
    if (chatId === "19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_90a27c51-5c74-453b-944a-134ba86da790@unq.gbl.spaces") {
      return [
        {
            "@odata.type": "#microsoft.graph.aadUserConversationMember",
            "id": "8b081ef6-4792-4def-b2c9-c363a1bf41d5",
            "roles": [],
            "displayName": "John Doe",
            "userId": "8b081ef6-4792-4def-b2c9-c363a1bf41d5",
            "email": null
        },
        {
          "@odata.type": "#microsoft.graph.aadUserConversationMember",
          "id": "8b081ef6-4792-4def-b2c9-c363a1bf41d6",
          "roles": [],
          "displayName": "Sam Adams",
          "userId": "8b081ef6-4792-4def-b2c9-c363a1bf41d6",
          "email": null
      }
    ];
    } else {
      return [
        {
            "@odata.type": "#microsoft.graph.aadUserConversationMember",
            "id": "8b081ef6-4792-4def-b2c9-c363a1bf41d5",
            "roles": [],
            "displayName": "John Doe",
            "userId": "8b081ef6-4792-4def-b2c9-c363a1bf41d5",
            "email": null
        }
      ];
    }
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