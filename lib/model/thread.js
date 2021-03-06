const MessageList = require('./message-list')

class Thread extends MessageList {
  constructor(channel, id) {
    super(channel.account, 'thread', id)
    this.channel = channel
    this.channel.openedThreads.push(this)
  }

  clear() {
    super.clear()
    const i = this.channel.openedThreads.indexOf(this)
    if (i === -1) {
      console.error('Removing orphan thread', this.id)
      return
    }
    this.channel.openedThreads.splice(i, 1)
  }

  containsMessagesFromUser(userId) {
    for (let message of this.messages) {
      if (message.user.id === userId)
        return true;
    }
    console.log('Rejected a thread');
    return false;
  }
}

module.exports = Thread
