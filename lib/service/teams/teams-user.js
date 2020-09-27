const User = require('../../model/user')

class TeamsUser extends User {
  // The "account" parameter is not currently used in this class but it is
  // used in the Slack equivalent of this class.  Keeping the account parameter
  // here to maintain consistency with the SlackUser class and so that the signature
  // of the constructor does not need to change if an instance of the TeamsAccount
  // is needed when the TODO items below are addressed.
  constructor(account, event) {

    /***
     * TODO:
     * 1. The concept of status text seems to be quite different in Teams
     *    than it is in Slack.  Need to determine how and where to best
     *    handle for Teams.
     * 2. Determine how to handle getting a user's icon/profile picture for MS Teams
     *    In the desktop app the behavior appears to be to display a circle (in a random
     *    color) containing the user's initials if the user does not have a profile picture
     *    set and to display the profile picture if one is set.     
     * 3. Determine if Teams has the concept of "bot" users and update this class accordingly.
     *    For now, all users are treated as NOT being bot users.
     * 4. Determine if Teams has the concept of status emoji and update this class accordingly.
     ***/

    let phoneNumber = ''
    let icon = ''
    let statusText = ''

    phoneNumber = event.businessPhones.length > 0 ? event.businessPhones[0] : "";

    // Slack makes a distinction between a user's real name and their
    // display name.  MS Teams does not appear to offer users the ability
    // to define a display name that is different than their real name, 
    // so the call to the superclass constructor below uses display name
    // for both display name and real name.
    super(event.id, event.displayName, icon, event.displayName, event.mail, phoneNumber, statusText, event.jobTitle)
    this.isBot = false;
  }


  setAway(isAway) {
    this.isAway = isAway
  }
}

module.exports = TeamsUser
