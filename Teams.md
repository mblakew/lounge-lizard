# Lounge Lizard for Microsoft Teams 

## Microsoft Graph 

Microsoft graph is the gateway to getting Microsoft Teams integrated into the Lounge Lizard chat client.  It exposes the necessary APIs for all Microsoft products.

## Register application 

Microsoft requires new applications to register with them in order to gain access to the Microsoft Graph API. The documentation for that process is found here: https://docs.microsoft.com/en-us/graph/auth-register-app-v2

You’ll need some elevated permissions.

## MSGraph SDK

https://github.com/microsoftgraph/msgraph-sdk-javascript

This is the officially supported “lightweight wrapper” around MS Graph for Node.js. It is available via NPM for download: `npm install @microsoft/microsoft-graph-client`.

Microsoft highly recommends using this module when building a client that consumes any Microsoft 365 data. 

## Authentication

Like with any API, Microsoft Graph requires authentication. Microsoft recommends using an Auth SDK to simplify the authentication process. The recommended open source SDK for Node is found here: https://github.com/panva/node-openid-client. Alternatively, stick with the current auth implementation for Slack and simply substitute in the Microsoft requirements.

To authenticate with a user, follow these instructions: https://docs.microsoft.com/en-us/graph/auth-v2-user

## Teams API

PLEASE NOTE: As of April 2020, the Microsoft Graph Teams API stable release does not include any chat message functionality. The chatMessage endpoint is currently in beta at the time of writing this. Therefore, proceeding with work on this should be done with caution as it is not officially supported. 

Here’s the documentation for the chatMessage endpoints: https://docs.microsoft.com/en-us/graph/api/resources/chatmessage?view=graph-rest-beta

Endpoints include, but are not limited to: Create chatMessage, get chatMessage, create subscription for channel, list all chat messages in channel, and get delta chat messages in channel. 

Below is a JSON representation of the chatMessage return type. It appears to have everything needed to integrate nicely into the existing Lounge Lizard application. 

``{
  "id": "string (identifier)",
  "replyToId": "string (identifier)",
  "from": {"@odata.type": "microsoft.graph.identitySet"},
  "etag": "string",
  "messageType": "string",
  "createdDateTime": "string (timestamp)",
  "lastModifiedDateTime": "string (timestamp)",
  "deletedDateTime": "string (timestamp)",
  "subject": "string",
  "body": {"@odata.type": "microsoft.graph.itemBody"},
  "summary": "string",
  "attachments": [{"@odata.type": "microsoft.graph.chatMessageAttachment"}],
  "mentions": [{"@odata.type": "microsoft.graph.chatMessageMention"}],
  "importance": "string",
  "policyViolation": "string",
  "reactions": [{"@odata.type": "microsoft.graph.chatMessageReaction"}],
  "locale": "string",
  "deleted": true
}``

## Extending the API

There are some cases where the Microsoft API is insufficient for the data we want to display and manipulate like, for example, adding custom emojis for message reactions. Luckily, Microsoft boasts the ability to extend its APIs without having an external data store. More on that here: https://docs.microsoft.com/en-us/graph/extensibility-overview

## Known Issues



## Unsupported Functionaity

* **Message pinning** - Microsoft Teams does not have the concept of message pinning.

* **Saving messages** - Also known as starring messages.  Microsoft Teams does support the concept of saving messages and 
the Microsoft Teams desktop app lets users see a list of messages that they have saved.  However, the Microsoft Graph API 
does not provide a means for a consumer to set the saved status of a message nor does it provide a way to retrieve a list
of saved messages.


## Supported but Not Implemented Functionality

