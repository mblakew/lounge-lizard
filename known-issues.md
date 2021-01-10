
This document lists known issues in Lounge Lizard that must be addressed.  In some cases, these are conventional "issues" that 
are bugs.  In other cases, these are simply items that must or should be addressed by those who work on Lounge Lizard in the
future.

**Important note:** There is additional and important information that may guide future work on Lounge Lizard in the [Supported Features](supported-features.md) and [Teams](Teams.md) documents located in this repository.

## General Issues

* **Updates from Wey:** The branch **feature/updates-from-wey** contains the union of all changes made in this repository and all changes made in the original 
Wey repository as of December 2020.  One signficant change coming from the Wey repository is that the Node.js version has been updated 
from v10.x to v12.x.  An important outstanding task is to thoroughly test the code in the **feature/updates-from-wey** branch to ensure 
that all Lounge Lizard functionality is working as expected with both Slack and Microsoft Teams.  Any issues found must be addressed 
before the code in **feature/updates-from-wey** is merged into the **main** branch.

* **Migrate outstanding tasks from Trello to GitHub:** The Lounge Lizard project currently uses Trello for task tracking on a kanban-style 
board.  However, it is recommended that task tracking be migrated from Trello to GitHub so that all relevant information related to Lounge 
Lizard can be stored in a single location.  GitHub supports the use of **Issues** which can be used to track bugs and desired new 
functionality.   GitHub also supports the creation of one or more **Projects** in a repository.  A kanban board can be set up in a GitHub
project and be used for task tracking.  Tasks/cards on a project board can be based on issues or can be created manually.  See 
[Managing project boards](https://docs.github.com/en/free-pro-team@latest/github/managing-your-work-on-github/managing-project-boards) 
for more information.

* **Current view not refreshed when a new message arrives:** If a new message arrives while a user is viewing a particular channel, 
the system notification for the new message is displayed but the contents (i.e. message list) that is displayed is not refreshed to 
include the new message.  An easy way to observe this issue is to use the application to send direct messages to yourself.

* **Clearing Quill editor:** The initial state of the Quill editor is that it is empty and the placeholder text is displayed.  Ideally, after a user sends a message it would return to this state.  Instead, it contains multiple blank lines and does not display the placeholder text.

* **Top bar is not pinned:** The top bar that is displayed at the top of the messages pane when a user is viewing a channel should remain visible while the user is scrolling through messages; only the messages and editor should scroll.  Currently, the top bar is in the same scrollable container as the messages and, thus, it scrolls out of view when a user scrolls through messages.

* **App crashes if user presses Shift-Enter:** If the Quill editor has focus and the user presses Shift-Enter (as would typically be done in a chat client to insert a new line in the message that is being composed), the application crashes (immediately terminates with no error displayed on screen).

* **Poor display of long team names:** When a team/account is selected in the accounts panel, the channels panel displays the name of the team/account along with all of the channels and direct messages for that team/account.  If the team name is too long to be fully displayed, the text wraps to a new line but the bounds of the rectangle where the team name is displayed are such that only the top few pixels of the second line are displayed.

* **Channel users popup does not scroll:** When a user right-clicks a channel in the channels panel and selects **View Members**, a popup is displayed that lists all of the members in the channel.  However, the content of the popup is not scrollable with the result that not all members can be seen if there are more than what will fit in the popup.

* **Channel users popup intermittently crashes:** When a user right-clicks a channel in the channels panel and selects **View Members**, a popup is displayed that lists all of the members in the channel. Frequently, that popup window will crash (disappear) with no apparent cause and 
no error message displayed in the GUI or in the console.

* **Encrypt tokens:** The user's Slack API tokens and Microsoft refresh tokens are stored in an application configuration file and can be 
viewed by any user or process with access to the location on disk where the configuration file is stored.  These values should be encrypted 
before they are written to the configuration file in order to decrease the possibility that they will be accessed and used improperly.

* **Performance:** There are some parts of the application where poor performance adversely impacts the user experience.  This is most
pronounced when initially viewing a channel in a Microsoft Teams account and that channel contains many messages.  In some cases, the 
current application code suffers from N+1 problems while in other cases the application may be making synchronous API calls that should 
instead be done asynchronously.  (Note that though the application uses libraries that make asynchronous API calls, the application uses 
async/await to wait on the results of those API calls, thus effectively making them synchronous calls.)

## Slack

* **Slack deprecated API methods:** Some API methods used by Lounge Lizard have been deprecated by Slack and will stop functioning in 
February 2021.  Upon preliminary analysis, it appears that the impact may be somewhat limited in scope but it will be necessary to 
update the affected code before February 2021 in order to ensure the continued operation of Lounge Lizard with Slack accounts.  See 
[Deprecating early methods in favor of the Conversations API](https://api.slack.com/changelog/2020-01-deprecating-antecedents-to-the-conversations-api) 
for more information.

* **Slack authentication:** Lounge Lizard currently uses an undocumented legacy API method to sign in a Slack user and obtain a token which can be
subsequently used when making Slack API calls.  Because the authentication method currently in use is undocumented, it is not known when or
if it will ever stop working.  It may be preferable to switch to using documented methods to perform user authentication. See more at:
   * https://api.slack.com/changelog/2016-05-19-authorship-changing-for-older-tokens
   * https://blacksunhackers.club/2019/03/acquiring-and-abusing-legacy-slack-tokens/

* **GUI display of pinned items:** Currently, when a user clicks the "View pinned items" hyperlink, the raw JSON for the pinned items is displayed in the console.

* **Users are not displayed for a multi-party Slack DM:** The application does not currently contain any code that will retrieve a list of
users who are participating in a multi-party Slack direct message.  If a user right-clicks such Slack direct message that includes multiple
participants and subsequently selects **Show Users**, an empty popup window is displayed.

* **Update to latest Slack client:** Lounge Lizard currently uses an older, deprecated version of the Slack Node.js SDK (client).  The 
application needs to be updated to use a recent, supported version of the client instead.  Note that this task may become moot once the 
**Updates from Wey** task has been completed as the **feature/updates-from-wey** branch already uses a newer version of the Slack client.

## MS Teams

* **Microsoft Azure application registration:** The file [teams-api-helper.js](lib/service/teams/teams-api-helper.js) currently contains 
an application (client) ID and redirect URI for an application called **SampleApp** that was created in a test organization which was 
registered with Microsoft in fall 2020 and which may have a limited lifetime.  To ensure the continued operation of Lounge Lizard, future 
contributors should create a new, long-lived organization, create a new application registration in Microsoft Azure, and update the client
ID and redirect URI in [teams-api-helper.js](lib/service/teams/teams-api-helper.js).  Note that both client ID and redirect URI are 
critical components of the application's authentication flow although redirect URI is not used except as part of the payload that is 
sent to Microsoft when retrieving an access token for a user.

* **Server updates:** The application is not currently capable of detecting when updated data is available and retrieving updated data.
See the [Teams](Teams.md) document for more information.

* **Example events:** The TeamsAccount class registers listeners for two example events called TEST_EVENT and TEST_EVENT_WITH_PARAM
though the TeamsApiHelper class does not currently contain any code that raises either of those events.  These events are intended to 
illustrate the pattern that should be followed when actual events need to be added to the TeamsApiHelper class in response to updated
data such as new messages or user status changes that has been received from the server.  These example events should be removed when 
they are no longer useful.

* **Mock "received" messages:** Currently, Lounge Lizard is not capable of detecting updated data such as new messages.  In order to 
allow testing of application functionality related to the receipt of a new message when using a Microsoft Teams account, the TeamsApiHelper
class periodically raises "new message" events for mock messages that have been generated. When the application has been updated to actually
detect new messages coming from the server, this code should be removed.  Until that time, it is necessary to copy the file 
**testdata.sample.json** to **testdata.json** and update the values in the file with actual values from your Microsoft Teams account.

* **Team and user images:** The application currently does not retrieve and display team or user images for Microsoft Teams accounts.  The method
of getting these images for MS Teams is quite different than it is for Slack and will require some fairly significant rearchitecting of the code
that retrieves images from the internet.  The main challenge is that the code currently can only perform unauthenticated http GETs that are
identical for any image.  For MS Teams, though, the application must perform an authenticated API call and will have specific paths for team
images and individual profile images which must be handled.

* **Sending @mentions:** The code that currently exists to send @mentions for MS Teams is based on Slack functionality.  This code needs to be 
updated to work as expected with MS Teams.  Note, however, that @mentions are much more complicated with MS Teams than they are in Slack.  With 
Slack, @mentions are sent as a simple string in the message text.  In teams, however, they consist of two parts:
   1. A special html-like <at> tag in the message body, and
   1. An object in the **mentions** collection of the message that contains information about the person, team, or channel being mentioned.

* **Custom emoji:** The application does not currently support custom emoji for Microsoft Teams and a mechanism has not been identified that 
would be suitable for adding support for custom emoji.

* **Display profile not working for MS Teams:** When a user clicks the name of another user in a channel message, a popup window should be displayed containing profile information for the selected user.  This works fine for Slack accounts but is not currently working for MS Teams accounts.

