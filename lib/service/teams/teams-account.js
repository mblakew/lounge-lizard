const bounds = require('binary-search-bounds')
const { ErrorCode, RTMClient } = require('@slack/client')

const Account = require('../../model/account')
const TeamsMessage = require('./teams-message')
const TeamsChannel = require('./teams-channel')
const TeamsDirectMessage = require('./teams-direct-messsage')
const TeamsReaction = require('./teams-reaction')
const TeamsUser = require('./teams-user')

const TeamsApiHelper = require('./teams-api-helper')

function compareChannel(a, b) {
  const nameA = a.name.toUpperCase()
  const nameB = b.name.toUpperCase()

  // Channels in the MS Teams desktop app are sorted with "General"
  // first and remaining channels sorted alphabetically
  if (a.name === "General")
    return -1;
  if (b.name === "General")
    return 1;

  // Push muted channels to bottom of list.
  if (a.isMuted === b.isMuted) {
    if (nameA < nameB)
      return -1
    if (nameA > nameB)
      return 1
    return 0
  }

  if (a.isMuted)
    return 1

  return -1
}

function filterDM(c) {
  return c.is_open || c.has_unreads
}

class TeamsAccount extends Account {
  constructor(service, id, name, token) {
    super(service, id, name)
    this.setupRTMClient(token)

    // TODO: Replace this with the passed-in token
    // Until we get the specifics of authentication sorted out, get an access token from
    // Microsoft's Graph API explorer and paste it below.
    const accessToken = "";

    // Should this be somewhere else?
    this.apiHelper = new TeamsApiHelper(accessToken);
  }

  setupRTMClient(token) {
    this.authorizationHeader = `Bearer ${token}`
    const options = {
      autoReconnect: true,
      // This is passed to `retry`, should do retry in a short forever manner,
      // since Slack can not recover if transiting to failure state, and we do
      // not know when network would recover.
      retryConfig: { maxTimeout: 2 * 1000, forever: true },
    }
    // Start real time client.
    this.rtm = new RTMClient(token, options)
    require('./private-apis').extend(this.rtm)
    this.rtm.once('authenticated', this.ready.bind(this))
    this.rtm.start({ batch_presence_aware: true })

    // Indicate whether this is reconnection.
    this.isReconnect = false

    this.rtm.on('error', this.reportError.bind(this))
    this.rtm.on('connected', this.handleConnection.bind(this))
    this.rtm.on('disconnected', this.handleDisconnection.bind(this))
    this.rtm.on('connecting', this.handleConnecting.bind(this))
    this.rtm.on('reconnecting', this.handleConnecting.bind(this))

    this.rtm.on('message', this.dispatchMessage.bind(this))
    this.rtm.on('reaction_added', this.setReaction.bind(this, true))
    this.rtm.on('reaction_removed', this.setReaction.bind(this, false))
    this.rtm.on('star_added', this.setStar.bind(this, true))
    this.rtm.on('star_removed', this.setStar.bind(this, false))

    this.rtm.on('pin_added', this.setPin.bind(this, true));
    this.rtm.on('pin_removed', this.setPin.bind(this, false));

    this.rtm.on('channel_marked', this.markRead.bind(this))
    this.rtm.on('group_marked', this.markRead.bind(this))
    this.rtm.on('im_marked', this.markRead.bind(this))

    this.rtm.on('channel_history_changed', this.reloadHistory.bind(this))
    this.rtm.on('group_history_changed', this.reloadHistory.bind(this))

    this.rtm.on('channel_joined', this.joinChannel.bind(this))
    this.rtm.on('group_joined', this.joinChannel.bind(this))
    this.rtm.on('group_open', this.joinChannel.bind(this))

    this.rtm.on('im_open', this.openDM.bind(this))
    this.rtm.on('conversations.open', this.joinDM.bind(this))

    this.rtm.on('im_close', this.closeDM.bind(this))
    this.rtm.on('group_close', this.closeDM.bind(this))

    this.rtm.on('channel_archive', this.leaveChannel.bind(this))
    this.rtm.on('channel_deleted', this.leaveChannel.bind(this))
    this.rtm.on('channel_left', this.leaveChannel.bind(this))
    this.rtm.on('group_archive', this.leaveChannel.bind(this))
    this.rtm.on('group_left', this.leaveChannel.bind(this))

    this.rtm.on('presence_change', this.handlePresenceChange.bind(this))
  }

  async ready(data) {
    // Update current team information.
    const { team } = await this.rtm.webClient.team.info()
    this.icon = team.icon.image_132
    this.url = `https://${team.domain}.slack.com`
    this.onUpdateInfo.dispatch(this)
    // Fetch users.
    // TODO We need a better policy for users cache.
    const { members } = await this.rtm.webClient.users.list({ limit: 2000 })
    for (const m of members) {
      // Don't handle deleted users unless we specifically need them in fetchUser
      if (m.deleted !== true)
        this.saveUser(m)
    }
    // Current user.
    this.currentUserId = data.self.id
    this.currentUserName = data.self.name
    // Fetch custom emojis
    await this.updateEmoji()
    // Fetch channels.
    await this.updateChannels()
  }

  async updateEmoji() {
    this.emoji = {}
    const { emoji } = await this.rtm.webClient.emoji.list()
    for (const name in emoji) {
      const url = emoji[name]
      if (url.startsWith('alias:'))
        this.emoji[name] = emoji[url.substr(6)]
      else
        this.emoji[name] = url
    }
  }

  async updateChannels() {

    // This is the old call to the Slack API and will ultimately be removed
    const options = {
      include_message: 1,
      mpim_aware: 1,
      simple_unreads: 1,
    }
    const { channels, groups, ims, mpims } = await this.rtm.webClient.users.counts(options)

    // TODO: Get the correct team id based on what team the user has logged in to
    //       The hard-coded value below is the id for the "COP4600: Operating Systems (Fall 2020)" team
    const teamsChannels = await this.apiHelper.getChannels("be79082b-c2b2-429a-9aba-47c147335c55");

    this.channels = teamsChannels
      .map((c) => new TeamsChannel(this, c))
      .sort(compareChannel)

    // TODO: Use List Chats to get direct messages.
    //       See https://docs.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-beta&tabs=http
    //       Note that it seems that it will be necessary to use "List Chat Members" to determine
    //       the person with whom we are chatting as the List Chats API call does not return any information
    //       about the chat members
    //       For right now, this is still querying Slack for chats/direct messages
    this.dms = ims.concat(mpims)
      .filter(filterDM)
      .map((c) => new TeamsDirectMessage(this, c))
    // Notify.
    this.updatePresenceSubscription()
    this.channelsLoaded()
  }

  updatePresenceSubscription() {
    this.rtm.subscribePresence(this.dms.map(dm => dm.userId))
  }

  reportError(error) {
    // TODO Show error box.
    console.error(error)
  }

  handleConnection() {
    this.status = 'connected'
    this.onUpdateConnection.dispatch()
    if (this.isReconnect)
      this.updateChannels()
    else  // all connections are re-connect except for the first one.
      this.isReconnect = true
  }

  handleDisconnection() {
    for (const c of this.channels)
      c.clear()
    this.status = 'disconnected'
    this.onUpdateConnection.dispatch()
  }

  handleConnecting() {
    this.status = 'connecting'
    this.onUpdateConnection.dispatch()
  }

  async dispatchMessage(event) {
    const channel = this.findChannelById(event.channel)
    if (!channel)
      return

    switch (event.subtype) {
      case 'message_deleted': {
        if (event.previous_message.thread_ts) {
          // Emit event in thread if it is opened.
          const thread = channel.findThread(event.previous_message.thread_ts)
          if (thread)
            thread.deleteMessage(event.deleted_ts, event.deleted_ts)
        }
        // Emit event in channel if the message does not belong to a thread, or
        // if it is parent of a thread.
        if (event.previous_message.thread_ts === undefined ||
          event.previous_message.thread_ts === event.previous_message.ts)
          channel.deleteMessage(event.deleted_ts, event.deleted_ts)
        break
      }

      case 'message_changed': {
        // When changing a thread message due to replyCount change, Slack only
        // passes partial information.
        let isPartialChange = false
        if (event.message.thread_ts && event.message.thread_ts === event.message.ts) {
          const original = channel.findMessage(event.message.ts, event.message.ts)
          if (original && event.message.reply_count !== original.replyCount)
            isPartialChange = true
        }
        // For non-partial change, simply modify the message.
        if (!isPartialChange) {
          const modified = new TeamsMessage(this, event.message)
          await modified.fetchPendingInfo(this)
          if (modified.threadId) {
            // Emit event in thread if it is opened.
            const thread = channel.findThread(modified.threadId)
            if (thread)
              thread.modifyMessage(modified.id, modified.timestamp, modified)
          }
          // Emit event in channel if the message does not belong to a thread, or
          // if it is parent of a thread.
          if (!modified.threadId || modified.isThreadHead)
            channel.modifyMessage(modified.id, modified.timestamp, modified)
          break
        }
        // Else fallback to next stage.
      }

      case 'message_replied': {
        // Slack only pass partial information when a message is replied, so
        // find the original message and modify replyCount.
        const original = channel.findMessage(event.message.ts, event.message.ts)
        if (!original)
          break
        const partial = new TeamsMessage(this, event.message)
        await partial.fetchPendingInfo(this)
        original.isThreadParent = partial.isThreadParent
        original.replyCount = partial.replyCount
        original.replyUsers = partial.replyUsers
        // Emit for channel and thread.
        const thread = channel.findThread(partial.threadId)
        if (thread)
          thread.modifyMessage(original.id, original.timestamp, original)
        channel.modifyMessage(original.id, original.timestamp, original)
        break
      }

      default: {
        const message = new TeamsMessage(this, event)
        await message.fetchPendingInfo(this)
        if (message.threadId) {
          // Emit event in thread if it is opened.
          const thread = channel.findThread(message.threadId)
          if (thread)
            thread.dispatchMessage(message)
        }
        // Emit event in channel if the message does not belong to a thread, or
        // if it is parent of a thread.
        if (!message.threadId || message.isThreadHead)
          channel.dispatchMessage(message)
      }
    }
  }

  setReaction(add, event) {
    const channel = this.findChannelById(event.item.channel)
    if (!channel)
      return
    const reaction = new TeamsReaction(this, event.reaction, 1, [event.user])
    if (add)
      channel.reactionAdded(event.item.ts, event.item.ts, reaction)
    else
      channel.reactionRemoved(event.item.ts, event.item.ts, reaction)
  }

  setPin(isPinned, event) {
    if (event.item.type !== 'message')
      return
    const channel = this.findChannelById(event.item.channel)
    if (channel)
      channel.updateMessagePin(event.item.message.ts, event.item.message.ts, isPinned)
  }

  setStar(hasStar, event) {
    if (event.item.type !== 'message')  // Only support message for now.
      return
    const channel = this.findChannelById(event.item.channel)
    if (channel)
      channel.updateMessageStar(event.item.message.ts, event.item.message.ts, hasStar)
  }

  markRead(event) {
    const channel = this.findChannelById(event.channel)
    if (channel)
      channel.markRead()
  }

  reloadHistory(event) {
    // TODO Reload chat.
    const channel = this.findChannelById(event.channel)
    if (channel)
      channel.clear()
  }

  async joinChannel(event) {
    console.log("joinChannel");

    let channel
    if (event.type === 'group_open') {
      const group = (await this.rtm.webClient.conversations.info({ channel: event.channel })).channel
      channel = new TeamsChannel(this, group)
    } else {
      channel = new TeamsChannel(this, event.channel)
    }
    const i = bounds.gt(this.channels, channel, compareChannel)
    this.channels.splice(i, 0, channel)
    this.onAddChannel.dispatch(i, channel)
  }

  leaveChannel(event) {
    const index = this.channels.findIndex((c) => c.id == event.channel)
    if (index === -1)
      return
    this.onRemoveChannel.dispatch(index, this.channels[index])
    this.channels.splice(index, 1)
  }

  handlePresenceChange(event) {
    const user = this.findUserById(event.user)
    if (!user)
      return
    user.setAway(event.presence === 'away')
    const userChannel = this.findChannelByUserId(user.id)
    if (userChannel)
      userChannel.setAway(event.presence === 'away')
  }

  async openDM(event) {
    const channel = new TeamsDirectMessage(this, event)
    this.dms.unshift(channel)
    this.updatePresenceSubscription()
    this.onOpenDM.dispatch(0, channel)
  }

  async joinDM(us) {
    return await this.rtm.webClient.conversations.open({ return_im: true, users: us })
  }

  async closeDM(event) {
    const index = this.dms.findIndex((c) => c.id == event.channel)
    if (index === -1)
      return
    this.onCloseDM.dispatch(index, this.dms[index])
    this.dms.splice(index, 1)
    this.updatePresenceSubscription()
  }

  // Save user for ID lookup
  saveUser(member) {
    return super.saveUser(new TeamsUser(this, member))
  }

  async fetchUser(id, isBot) {
    const user = this.findUserById(id)
    if (user)
      return user
    let member
    if (isBot) {
      const { bot } = await this.rtm.webClient.bots.info({ bot: id })
      member = bot
      // Slack's API is inconsistent for bot users.
      member.is_bot = true
      member.profile = member.icons
    } else {
      const { user } = await this.rtm.webClient.users.info({ user: id })
      member = user
    }
    return this.saveUser(member)
  }

  async listUsers(options, filter)  {
    let ret = []
    while (true) {
      // Read all channels using pagination.
      let {members, response_metadata} = await this.rtm.webClient.users.list(options)
        if (filter)
        members = members.filter(filter)

      ret = ret.concat(members)
      if (response_metadata && response_metadata.next_cursor)
        options.cursor = response_metadata.next_cursor
      else
        break
    }
       return ret.sort(compareChannel)

  }

  async listChannels(options, filter) {
    let ret = []
    while (true) {
      // Read all channels using pagination.
      let { channels, response_metadata } = await this.rtm.webClient.conversations.list(options)
      if (filter)
        channels = channels.filter(filter)
      ret = ret.concat(channels.map((c) => new TeamsChannel(this, c)))
      if (response_metadata && response_metadata.next_cursor)
        options.cursor = response_metadata.next_cursor
      else
        break
    }
    return ret.sort(compareChannel)
  }

  serialize() {
    const config = { token: this.rtm.webClient.token }
    return Object.assign(super.serialize(), config)
  }

  async disconnect() {
    if (this.rtm.connected)
      this.rtm.disconnect()
  }

  async reload() {
    if (this.status === 'disconnected')
      this.rtm.start({ batch_presence_aware: true })
    else if (this.status === 'connected')
      await this.updateChannels()
  }

  async getAllChannels() {
    return await this.listChannels({
      exclude_archived: true,
      exclude_members: true,
      types: 'public_channel,private_channel',
    })
  }

  async getAllUsers() {
    return await this.listUsers({})
  }

  async join(channel) {
    await this.rtm.webClient.conversations.join({ channel: channel.id })
  }

  async joinDM(us)  {
    return await this.rtm.webClient.conversations.open({return_im : true, users: us})
  }

  async leave(channel) {
    if (channel.type === 'channel')
      await this.rtm.webClient.conversations.leave({ channel: channel.id })
    else
      await this.rtm.webClient.conversations.close({ channel: channel.id })
  }
}

module.exports = TeamsAccount
