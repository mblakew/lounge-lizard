const User = require('../../model/user')
const Message = require('../../model/message')
const TeamsFile = require('./teams-file')
const TeamsReaction = require('./teams-reaction')

const { teamsMarkdownToHtml, parseEmojiFromMessage } = require('./message-parser');

// Map Teams reaction names to the emoji names expected by the front end
// MS Teams supported values are like, angry, sad, laugh, heart, surprised
// Generic Slack/emoji equivalents: +1, angry, cry, laughing, heart, open_mouth
const reactionNameMap = {
  like: "+1",
  angry: "angry",
  sad: "cry",
  laugh: "laughing",
  heart: "heart",
  surprised: "open_mouth"
}

function utcDatetimeToTimestamp(utcDatetime) {
  const dt = Date.parse(utcDatetime);
  return dt/1000;
}

class TeamsMessage extends Message {
  constructor(account, event) {
    super(event.id, parseEmojiFromMessage(event, false), utcDatetimeToTimestamp(event.lastModifiedDateTime))

    if (event.attachments && event.attachments.length > 0) {
      // Filter on attachments where contentType = "reference" and get
      // contentUrl and name.
      this.files = event.attachments
        .filter(e => e.contentType === "reference")
        .map(e => new TeamsFile(e.name, e.contentUrl))
    }

    if (event.lastEditedDateTime) {
      this.isEdited = true
    }

    if (event.reactions && event.reactions.length > 0) {
      let reactionCounts = {}

      event.reactions.map(r => {
        if (reactionCounts[r.reactionType]) {
          reactionCounts[r.reactionType]++;
        } else {
          reactionCounts[r.reactionType] = 1;
        }
      })

      const reactionKeys = Array.from(Object.keys(reactionCounts))

      this.reactions = reactionKeys.map(k => 
        // Only need users here if we are going to allow users to set/clear reactions
        new TeamsReaction(account, reactionNameMap[k], reactionCounts[k], [])
      )
    }

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
    this.user = account.findUserById(userId)
    if (!this.user) {
      this.user = new User(userId, event.from.user.displayName, '', event.from.user.displayName, '<unknown>', '<unknown>', '<unknown>', '<unknown>')
    }
  }



  async fetchPendingInfo(account) {
    if (this.text) {
      [this.hasMention, this.text] = await teamsMarkdownToHtml(this.text)
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
