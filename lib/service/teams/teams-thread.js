const Thread = require('../../model/thread')
const TeamsMessage = require('./teams-message')
const TeamsChannel = require('./teams-channel')

class TeamsThread extends Thread {
  constructor(channel, id) {
    super(channel, id)
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
    const messages = await this.account.apiHelper.getThreadMessages(this.account.teamId, this.channel.id, this.id);
    const smsgs = messages.map((m) => new TeamsMessage(this.account, m))
    return smsgs
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
