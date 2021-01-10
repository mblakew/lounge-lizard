const Reaction = require('../../model/reaction')

const { parseReaction } = require('./message-parser')

function normalizeReactionName(name) {
  const skin = name.indexOf('::')
  if (skin !== -1)
    return name.substring(0, skin)
  else
    return name
}

class TeamsReaction extends Reaction {
  constructor(account, name, count, userIds) {
    name = normalizeReactionName(name)
    super(name, count, parseReaction(account, 16, name))
    if (userIds.includes(account.currentUserId))
      this.reacted = true
  }
}

module.exports = TeamsReaction
