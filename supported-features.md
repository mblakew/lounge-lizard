
This document lists various features of a chat application and indicates whether each is supported by Slack and/or MS Teams and this application.

**Important note:** this file uses tables which are not part of the core Markdown specification and thus may not be displayed properly by all Markdown viewers.  However, they can be displayed as intended in the GitHub UI.  See https://docs.github.com/en/free-pro-team@latest/github/writing-on-github/organizing-information-with-tables.

## General Functionality ##

| Feature          | Slack              | LL for Slack       | MS Teams           | Graph API          | LL for Teams       |
| ---------------- | :----------------: | :----------------: | :----------------: | :----------------: | :----------------: |
| Get team icon    |
| Get user photo   |
| Add custom emoji | :white_check_mark: | 

## Channels

| Feature         | Slack              | LL for Slack       | MS Teams           | Graph API          | LL for Teams       |
| --------------- | :----------------: | :----------------: | :----------------: | :----------------: | :----------------: |
| Get channels    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Join channel    | :white_check_mark: | :white_check_mark: | :x:                | :x:                | :x:                |
| Leave channel   | :white_check_mark: | :white_check_mark: | :x:                | :x:                | :x:                |
| Create channel  | :white_check_mark: | :x:                | :white_check_mark: | :white_check_mark: | :x:                |
| Star channel    | :white_check_mark: | :x:                | :x:                | :x:                | :x:                |
| Manage channel  | :white_check_mark: | :x:                | :white_check_mark: | :white_check_mark: | :x:                |
| Delete channel  | :white_check_mark: | :x:                | :white_check_mark: | :white_check_mark: | :x:                |
| Get users       | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Get messages    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Send message    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |


## Chats (also called Conversations or Direct Messages)

| Feature          | Slack              | LL for Slack       | MS Teams           | Graph API          | LL for Teams       |
| ---------------- | :----------------: | :----------------: | :----------------: | :----------------: | :----------------: |
| Get chats        | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Create chat      | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x:                | :x:                |
| Close chat       | :white_check_mark: | :white_check_mark: | :x:                | :x:                | :x:                |
| Leave chat       | :question:         | :x:                | :white_check_mark: | :question:         | :x:                |
| Star chat        | :white_check_mark: | :x:                | :x:                | :x:                | :x:                |
| Pin chat         | :x:                | :x:                | :white_check_mark: | :question:         | :x:                |
| Get messages     | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Send message     | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |

## Threads

| Feature         | Slack              | LL for Slack       | MS Teams           | Graph API          | LL for Teams       |
| --------------- | :----------------: | :----------------: | :----------------: | :----------------: | :----------------: |
| Get threads     | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Create thread   | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Get messages    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Send message    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |


## Individual Messages (existing messages)

| Feature           | Slack              | LL for Slack       | MS Teams           | Graph API          | LL for Teams       |
| ----------------- | :----------------: | :----------------: | :----------------: | :----------------: | :----------------: |
| React to message  | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x:                | :x:                |
| Save message      | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x:                | :x:                |
| Share message     | :white_check_mark: | :x:                | :x:                | :x:                | :x:                |
| Follow message    | :white_check_mark: | :x:                | :x:                | :x:                | :x:                |
| Pin message       | :white_check_mark: | :white_check_mark: | :x:                | :x:                | :x:                |
| Delete message    | :white_check_mark: | :x:                | :white_check_mark: | :x:                | :x:                |
| Edit message      | :white_check_mark: | :x:                | :white_check_mark: | :x:                | :x:                |
| Show attachment   | :white_check_mark: | :question:         | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Show code snippet | :question:         | :question:         | :white_check_mark: | :white_check_mark: | :x:                |
| Show emoji        | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Show custom emoji | :white_check_mark: | :white_check_mark: | :x:                | :x:                | :x:                |
| Show @mentions    | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |


## Sending Messages

| Feature                     | Slack              | LL for Slack       | MS Teams           | Graph API          | LL for Teams       |
| --------------------------- | :----------------: | :----------------: | :----------------: | :----------------: | :----------------: |
| Attach file to message      | :white_check_mark: | :x:                | :white_check_mark: | :white_check_mark: | :x:                |
| Add code snippet to message | :question:         | :x:                | :white_check_mark: | :white_check_mark: | :x:                |
| Add emoji to message        | :white_check_mark: | :white_check_mark: | :white_check_mark: | 
| Add @mention to message     | :white_check_mark: | 
| Add inline image to message | :question:         |



### Notes
1. In MS Teams and the Graph API users are actually defined at the team level and not the channel level, but the application 
allows a user to see the user list at the channel level.
2. The distinction between starring a chat and pinning a chat is that starring a chat causes it to be marked as a favorite 
and thus displayed in a special section of the UI along with other starred items.  Pinning a chat just causes it to be displayed in 
a special subsection at the top of the list of all chats.
