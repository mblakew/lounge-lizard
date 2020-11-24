const DirectMessage = require('../../model/direct-message')
const TeamsChannel = require('./teams-channel')
const TeamsMessage = require("./teams-message")

class TeamsDirectMessage extends DirectMessage {
  constructor(account, event) {
    const user = event.memberName.length > 0 ? event.memberName[0] : "";
    super(account, event.id, user)

    if (event.memberName.length > 1) {
      this.isMultiParty = true;
      // If this is a multi-party chat, name is a comma-delimited list of participants
      this.name = event.memberName.join(', ');
    } else {
      this.isMultiParty = false;
      this.userId = event.memberId.length > 0 ? event.memberId[0] : null;
      if (this.userId === account.currentUserId)
        this.name = `${this.name} (you)`

      if (this.userId) {
        const presence = event.memberPresence && event.memberPresence.length > 0 ? event.memberPresence[0].availability : ''
        this.isAway = (presence === 'Offline' || presence === 'Away')
      }
    }

    // Save list of user ids for future use
    this.memberIds = event.memberId

    /***
     * This is used to initialize the number of unread messages shown in the UI.  Since
     * we cannot tell if messages are read or unread, just initialize to 0 so that UI
     * will only display a count of messages received after the application starts up.
     */
    this.mentions = 0;

    /***
     * When we receive chats and chat messages from the MS Graph API there is no information
     * returned that would tell us if there are any unread messages in the chat, so always
     * set this to false.
     */
    this.isRead = false

    /***
     * The isMember property does not appear to be used anywhere so it should not really
     * matter what value we assign here (or if we assign a value at all).  However, since
     * the current user is always a member of the chat/direct message we are creating we
     * might as well assign "true" in case this gets used in the future.
     */
    this.isMember = true
  }

  getMembers() {
    return TeamsChannel.prototype.getMembers.apply(this, arguments)
  }

  getProfile(){
    return TeamsChannel.prototype.getProfile.apply(this, arguments)
  }

  setMessageStar() {
    return TeamsChannel.prototype.setMessageStar.apply(this, arguments)
  }

  pinMessage() {
    return TeamsChannel.prototype.pinMessage.apply(this, arguments)
  }

  viewPinned() {
    return TeamsChannel.prototype.viewPinned.apply(this, arguments)
  }

  setMessageReaction() {
    return TeamsChannel.prototype.setMessageReaction.apply(this, arguments)
  }

  async openReactPicker() {
    return TeamsChannel.prototype.openReactPicker.apply(this, arguments)
  }

  async parseTags() {
    return TeamsChannel.prototype.parseTags.apply(this, arguments);
  }

  listEmotes() {
    return TeamsChannel.prototype.listEmotes.apply(this, arguments)
  }

  async readMessagesImpl() {
    const messages = await this.account.apiHelper.getChatMessages(this.id)
    const smsgs = messages.reverse().map((m) => new TeamsMessage(this.account, m))
    return smsgs
  }

  async sendMessage(text) {
    const response = await this.account.apiHelper.sendChatMessage(this.id, text);

    const message = new TeamsMessage(this.account, response)
    await message.fetchPendingInfo(this.account)
    this.dispatchMessage(message)
  }

  async notifyReadImpl() {
    /***
     * The MS Graph API does not expose a method for setting the ID of the last message 
     * that has been read by the user.  However, the base class will throw an exception 
     * if this method is not implemented in child classes, so we must have this here even
     * though it does not do anything.
     */
  }
}

module.exports = TeamsDirectMessage
