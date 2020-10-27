const User = require('../../model/user')
const Message = require('../../model/message')
// const TeamsAttachment = require('./teams-attachment')
// const TeamsFile = require('./teams-file')
// const TeamsReaction = require('./teams-reaction')
// const TeamsUser = require('./teams-user')

const { teamsMarkdownToHtml } = require('./message-parser')

function utcDatetimeToTimestamp(utcDatetime) {
  const dt = Date.parse(utcDatetime);
  return dt/1000;
}

class TeamsMessage extends Message {
  constructor(account, event) {
    super(event.id, event.body.content, utcDatetimeToTimestamp(event.lastModifiedDateTime))

    // if (event.text.match(/@[a-z0-9]+/gi)){
    //   this.hasMention = true;
    // }

    // if (event.attachments)
    //   this.attachments = event.attachments.map((att) => new TeamsAttachment(account, att))
    // if (event.files)
    //   this.files = event.files.filter((f) => f.mode != 'tombstone').map((f) => new TeamsFile(account, f))
    // if (event.edited && !this.isBot)
    //   this.isEdited = true

    // if (event.reactions)
    //   this.reactions = event.reactions.map((r) => new TeamsReaction(account, r.name, r.count, r.users))

    // MS Teams messages have a channel identity that contains properties we will use later 
    // to determine if this message is a parent of a thread/reply.  Note that these properties are
    // not mentioned in the MS documentation and are potentially only present on channel messages.
    if (event.channelIdentity) {
      this.teamId = event.channelIdentity.teamId
      this.channelId = event.channelIdentity.channelId
    } else {
      this.teamId = null
      this.channelId = null
    }

    this.replies = null

      let userId = event.from.user.id;
    
    //   this.user = account.findUserById(userId)
    //   if (!this.user) {
        // this.user = new User(userId, '<unknown>', '', '<unknown>', '<unknown>', '<unknown>', '<unknown>', '<unknown>')
        this.user = new User(userId, event.from.user.displayName, '', event.from.user.displayName, '<unknown>', '<unknown>', '<unknown>', '<unknown>')
  }



  async fetchPendingInfo(account) {
    if (this.text) {
      [this.hasMention, this.text] = await teamsMarkdownToHtml(account, this.text)
    }

    // Get replies for message.  If count > 0, set replyCount and set isThreadParent to true.
    if (this.teamId && this.channelId) {
      const replies = await account.apiHelper.getChannelMessageReplies(this.teamId, this.channelId, this.id)

      if (replies.length > 0) {
        this.isThreadParent = true
        this.replyCount = replies.length
        this.replies = replies.map(r => new TeamsMessage(account, r))
      } else {
        this.isThreadParent = false
        this.replyCount = 0
        this.replies = []
      } 
    }
  }
}

module.exports = TeamsMessage
