
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

## Slack


## MS Teams

* **Microsoft Azure application registration:** The file [teams-api-helper.js](lib/service/teams/teams-api-helper.js) currently contains 
an application (client) ID and redirect URI for an application called **SampleApp** that was created in a test organization which was 
registered with Microsoft in fall 2020 and which may have a limited lifetime.  To ensure the continued operation of Lounge Lizard, future 
contributors should create a new, long-lived organization, create a new application registration in Microsoft Azure, and update the client
ID and redirect URI in [teams-api-helper.js](lib/service/teams/teams-api-helper.js).  Note that both client ID and redirect URI are 
critical components of the application's authentication flow although redirect URI is not used except as part of the payload that is 
sent to Microsoft when retrieving an access token for a user.

## TODO




- bugs
- Slack functions being deprecated
- Sample event code
- Randomly generated "received" messages
- Slack auth model deprecated
[token]: https://api.slack.com/custom-integrations/legacy-tokens

- Trello cards

