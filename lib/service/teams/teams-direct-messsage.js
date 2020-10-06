const DirectMessage = require('../../model/direct-message')
const TeamsChannel = require('./teams-channel')

class TeamsDirectMessage extends DirectMessage {
  constructor(account, event) {
    // const user = account.findUserById(event.user_id)
    const user = event.memberName.length > 0 ? event.memberName[0] : "";
    super(account, event.id, user)

    /*****
     * TODO (fall2020): 
     * - Get mention count (or dm count?) and assign to this.mentions
     * - Get away status for participants
     * - Determine if there are unread messages in this chat and assign this.isRead accordingly
     * - Set this.lastReadTs to timestamp of last read message
     * - Determine what, if anything, should be assigned to this.isMember
     */

    if (event.memberName.length > 1) {
      this.isMultiParty = true;
      // If this is a multi-party chat, name is a comma-delimited list of participants
      // TODO (fall2020): remove current user by matching on id
      this.name = event.memberName.join(', ');
    } else {
      this.isMultiParty = false;
      this.userId = event.memberId.length > 0 ? event.memberId[0] : null;
      if (this.userId === account.currentUserId)
        this.name = `${this.name} (you)`
    }

    this.mentions = 0;
    this.isRead = false;
    this.isMember = true
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

  readMessagesImpl() {
    return TeamsChannel.prototype.readMessagesImpl.apply(this, arguments)
  }

  sendMessage() {
    return TeamsChannel.prototype.sendMessage.apply(this, arguments)
  }

  async notifyReadImpl() {
    /*****
     * TODO (fall2020):
     * - Update to use MS Graph API to mark all messages in chat as read
     */
  }
}

module.exports = TeamsDirectMessage
