
This folder contains two Postman collections which can be used together to interact with the Microsoft Graph API.  The collections are in Postman v2.1 (JSON) format and are derived from collections that can be downloaded from Microsoft.  The collections and environment were exported from and tested with Postman v7.34.0.  The **Azure AD v2.0 Protocols** collection is used to obtain an access token that can be used with the Microsoft Graph API and then the **Microsoft Graph** collection is used to actually make Graph API calls.  See more at https://docs.microsoft.com/en-us/graph/use-postman.  Note, however, that the Microsoft instructions at that URL use a username and password for authentication while Lounge Lizard is using device code flow.

## Using the Postman collections to simulate Lounge Lizard application flow

1. Import the collection file **Azure AD v2.0 Protocols.postman_collection.json** into Postman.
1. Import the collection file **Microsoft Graph.postman_collection.json** into Postman.
1. Import the environment file **Microsoft Graph.postman_environment.json** into Postman.
1. Using the environment dropdown in the top-right corner of the Postman window, change the environment to **Microsoft Graph environment**.
1. Click the button with the eye icon to edit the environment.
1. Enter the values for **ClientId** and **RedirectUri** from your Azure application registration.
1. In the folder **Azure AD v2.0 Protocols/OAuth 2.0 Device Flow** execute **Device Authorization Request**.
1. In a web browser, log in to a Microsoft account using the instructions in the API response.
1. In the folder **Azure AD v2.0 Protocols/OAuth 2.0 Device Flow** execute **Device Access Token Request**.
1. Execute **Get My Profile** in the folder **Microsoft Graph/On Behalf of a User/Users** to get information about your user account.
1. Execute **My Joined Teams** in the folder **Microsoft Graph/On Behalf of a User/Teams** to get a list of teams the user has joined.  The first team that is returned will be used for subsequent API calls that require a Team ID.
1. Execute **Members of a Team** in the folder **Microsoft Graph/On Behalf of a User/Teams** to get a list of members of the team obtained above.
1. Execute **Channels of a Team** in the folder **Microsoft Graph/On Behalf of a User/Teams** to get a list of channels for the team obtained above.  The first channel that is returned will be used for subsequent API calls that require a Channel ID.
1. Execute **Messages (without replies) in a Channel** in the folder **Microsoft Graph/On Behalf of a User/Teams** to get a list of messages for the channel obtained above.  The first message that is returned will be used for subsequent API calls that require a Message ID.
1. Execute **Replies to a Message in a Channel** in the folder **Microsoft Graph/On Behalf of a User/Teams** to get a list of replies for the message obtained above.
1. Execute **Send Message in a Channel** in the folder **Microsoft Graph/On Behalf of a User/Teams** to send a message in the Channel obtained above.
1. Execute **Send Reply to a Message in a Channel** in the folder **Microsoft Graph/On Behalf of a User/Teams** to send a a reply to the Message obtained above.
1. Execute **List Chats** in the folder **Microsoft Graph/On Behalf of a User/Chats** to get a list of chats (direct messages) in which the user is participating.  The first chat that is returned will be used for subsequent API calls that require a Chat ID.
1. Execute **List Chat Members** in the folder **Microsoft Graph/On Behalf of a User/Chats** to get a list of participants in the Chat obtained above.
1. Execute **Get Chat Messages** in the folder **Microsoft Graph/On Behalf of a User/Chats** to get a list of messages for the Chat obtained above.
1. Execute **Send Chat Message** in the folder **Microsoft Graph/On Behalf of a User/Chats** to send a message in the Chat obtained above.
1. Execute **Get Group Photo** in the folder **Microsoft Graph/On Behalf of a User/Users** to get the photo/avatar/icon for the Team obtained above.  Note that this functionality is not currently used for Microsoft Teams accounts in Lounge Lizard.


## Refresh an expired access token
The access token obtained above is valid for one hour.  To obtain a new access token execute **Token Request - Refresh Token** in the folder **Azure AD v2.0 Protocols/OAuth 2.0 Authorization Code Flow**.



## Source for Postman collection and environment files

* **Azure AD v2.0 Protocols.postman_collection.json:** https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
* **Microsoft Graph.postman_collection.json:** https://github.com/microsoftgraph/microsoftgraph-postman-collections/blob/master/Microsoft%20Graph.postman_collection.json
* **Microsoft Graph.postman_environment.json:** https://github.com/microsoftgraph/microsoftgraph-postman-collections/blob/master/Microsoft%20Graph.postman_environment.json

**Important Note:** Some modifications have been made from the original source to simplify the use of these collections, better reflect Lounge Lizard's application flow, and add functionality used by Lounge Lizard but missing from the original Postman collections.  The MS Graph API postman collections are copyrighted and licensed under the MIT license which can be found in the LICENSE file in this folder.
