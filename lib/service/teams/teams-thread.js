const Thread = require('../../model/thread')
const TeamsMessage = require('./teams-message')
const TeamsChannel = require('./teams-channel')

class TeamsThread extends Thread {
  constructor(channel, parentMessage) {
    super(channel, parentMessage.id)

    // The splice method modifies the original array but if we modify 
    // parentMessage.replies by splicing in parentMessage, we end up with 
    // a circular reference.  To avoid this, make a shallow copy of the 
    // replies array and use that instead.
    let messages = Array.from(parentMessage.replies)
    messages.splice(0, 0, parentMessage)
    this.messages = messages
  }

  async getProfile(id, timestamp){
    super.getProfile(id, timestamp)
  }

  async setMessageStar(id, timestamp, hasStar) {
    super.setMessageStar(id, timestamp, hasStar, this.channel.id)
  }

  async pinMessage(id, timestamp){
    super.pinMessage(id, timestamp, this.channel.id)
  }

  async viewPinned(id){
    super.viewPinned(id, this.channel.id)
  }

  async setMessageReaction(id, timestamp, name, reacted) {
    super.setMessageReaction(id, timestamp, name, reacted, this.channel.id)
  }

  async openReactPicker() {
    return TeamsChannel.prototype.openReactPicker.apply(this, arguments)
  }

  async readMessagesImpl() {
    // We already built our message collection for this thread in the
    // constructor, so we can just return an empty array here.
    return []
  }

  async sendMessage(text) {
    text = await this.parseTags(text)

    const response = await this.account.apiHelper.sendThreadMessage(this.id, this.account.currentUserId, this.account.currentUserName, text);

    const message = new TeamsMessage(this.account, response)
    await message.fetchPendingInfo(this.account)
    this.dispatchMessage(message)
  }

  async notifyReadImpl() {
    // Slack does not seem to have an API to mark thread as read.
  }
}

module.exports = TeamsThread
