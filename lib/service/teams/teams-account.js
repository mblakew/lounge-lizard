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

class TeamsAccount extends Account {
  constructor(service, id, name, token) {
    super(service, id, name)

    // TODO (fall2020): Replace this with the passed-in token

    // Until we get the specifics of authentication sorted out, get an access 
    // token using the insructions at https://github.com/microsoftgraph/msgraph-sdk-javascript/tree/dev/samples/node.
    // Note that it is recommended to copy the file secrets.sample.json to secrets.json 
    // instead of renaming so that the file secrets.sample.json is not inadvertently 
    // deleted from this repository.

    const accessToken = require("./secrets.json");

    this.setupTeamsClient(accessToken.accessToken);
  }

  setupTeamsClient(token) {
    this.apiHelper = new TeamsApiHelper(token);

    this.apiHelper.on(this.apiHelper.events.TEST_EVENT, this.handleTestEvent.bind(this));
    this.apiHelper.on(this.apiHelper.events.TEST_EVENT_WITH_PARAM, this.handleTestEventWithParam.bind(this, 77));

    // TODO (fall2020): Get the correct team id based on what team the user has logged in to
    //       The hard-coded value below is the id for the "COP4600: Operating Systems (Fall 2020)" team
    this.teamId = "be79082b-c2b2-429a-9aba-47c147335c55";

    // Start real time client.

    // require('./private-apis').extend(this.rtm)
    // this.rtm.once('authenticated', this.ready.bind(this))
    // this.rtm.start({ batch_presence_aware: true })
    this.ready();

    // Indicate whether this is reconnection.
    this.isReconnect = false

    // Need to invoke this to get the UI started, but doesn't seem like we need
    // something external to tell us when it is ok to invoke this.
    this.handleConnection();

    /***
     * TODO (fall2020): 
     * Determine which of the events listed below can be supported with MS Teams
     * and implement
     */
    // this.rtm.on('error', this.reportError.bind(this))
    // this.rtm.on('connected', this.handleConnection.bind(this))
    // this.rtm.on('disconnected', this.handleDisconnection.bind(this))
    // this.rtm.on('connecting', this.handleConnecting.bind(this))
    // this.rtm.on('reconnecting', this.handleConnecting.bind(this))

    // this.rtm.on('message', this.dispatchMessage.bind(this))
    // this.rtm.on('reaction_added', this.setReaction.bind(this, true))
    // this.rtm.on('reaction_removed', this.setReaction.bind(this, false))
    // this.rtm.on('star_added', this.setStar.bind(this, true))
    // this.rtm.on('star_removed', this.setStar.bind(this, false))

    // this.rtm.on('pin_added', this.setPin.bind(this, true));
    // this.rtm.on('pin_removed', this.setPin.bind(this, false));

    // this.rtm.on('channel_marked', this.markRead.bind(this))
    // this.rtm.on('group_marked', this.markRead.bind(this))
    // this.rtm.on('im_marked', this.markRead.bind(this))

    // this.rtm.on('channel_history_changed', this.reloadHistory.bind(this))
    // this.rtm.on('group_history_changed', this.reloadHistory.bind(this))

    // this.rtm.on('channel_joined', this.joinChannel.bind(this))
    // this.rtm.on('group_joined', this.joinChannel.bind(this))
    // this.rtm.on('group_open', this.joinChannel.bind(this))

    // this.rtm.on('im_open', this.openDM.bind(this))
    // this.rtm.on('conversations.open', this.joinDM.bind(this))

    // this.rtm.on('im_close', this.closeDM.bind(this))
    // this.rtm.on('group_close', this.closeDM.bind(this))

    // this.rtm.on('channel_archive', this.leaveChannel.bind(this))
    // this.rtm.on('channel_deleted', this.leaveChannel.bind(this))
    // this.rtm.on('channel_left', this.leaveChannel.bind(this))
    // this.rtm.on('group_archive', this.leaveChannel.bind(this))
    // this.rtm.on('group_left', this.leaveChannel.bind(this))

    // this.rtm.on('presence_change', this.handlePresenceChange.bind(this))

  }

  handleTestEvent(eventParam) {
    console.log("Test event");
    console.log(eventParam);
  }

  handleTestEventWithParam(myParam, eventParam) {
    console.log("Test event with param");
    console.log("My param: " + myParam);
    console.log("Event param:" + eventParam);
  }

  async ready() {

    // TODO (fall2020): Need to determine if there is a way to get the team icon from
    //       the graph API (or to somehow use the Graph API and other knowledge)
    //       to construct a usable URL for an icon.  Until then, here is a hard-coded
    //       URL for the Cacti Council icon from Slack.
    //       Note that there is a method in the Graph API that can get a photo for a group
    //       (which should be equivalent to a Team) but it is not currently known what would 
    //       be returned if the group does not have a photo set (in that situation the Teams
    //       web app downloads an image that consists of two letters derived from the name on
    //       a randomly-colored square background).  See reference for Get Photo method
    //       at https://docs.microsoft.com/en-us/graph/api/profilephoto-get?view=graph-rest-beta.
    this.icon = "https://avatars.slack-edge.com/2016-09-30/86179276007_046bf7b1d422948da1b3_88.png";

    // TODO (fall2020): Need to determine if we need this URL and, if so, how to construct it.
    // this.url = `https://${team.domain}.slack.com`

    this.onUpdateInfo.dispatch(this)

    // Fetch all users in current team
    const members = await this.apiHelper.getTeamMembers(this.teamId);
    members.forEach(m => this.saveUser(m))

    // Current user
    const currentUser = await this.apiHelper.getCurrentUser();
    this.currentUserId = currentUser.id;
    this.currentUserName = currentUser.displayName;

    // Fetch custom emojis
    await this.updateEmoji()

    // Fetch channels.
    await this.updateChannels()

  }

  async updateEmoji() {
    /***
     * TODO (fall2020): 
     * Determine if there is a way to get an emoji list with the MS Graph API
     * (and also determine how this list is used).
     */
    this.emoji = {}
  }

  async updateChannels() {
    const teamsChannels = await this.apiHelper.getChannels(this.teamId);

    this.channels = teamsChannels
      .map((c) => new TeamsChannel(this, c))
      .sort(compareChannel)

    const teamsChats = await this.apiHelper.getChats();
    const chatsWithMembersPromise = teamsChats.map(async c => {
      const chatMembers = await this.apiHelper.getChatMembers(c.id);
      return {
        id: c.id,
        topic: c.topic,
        createdDateTime: c.createdDateTime,
        lastUpdatedDateTime: c.lastUpdatedDateTime,
        memberName: chatMembers.map(m => {return m.displayName }),
        memberId: chatMembers.map(m => {return m.userId})
      };
    });

    const chatsWithMembers = await Promise.all(chatsWithMembersPromise).then(r => {return r;});
 
    this.dms = chatsWithMembers.map((c) => new TeamsDirectMessage(this, c))

      // Notify.
    this.updatePresenceSubscription()
    this.channelsLoaded()
  }

  updatePresenceSubscription() {
    /***
     * TODO (fall2020): 
     * Determine how we can tell (with the MS Graph API) what a user's status 
     * (i.e. Available, Busy, etc.) is and, more importantly, when it has changed.
     * See https://docs.microsoft.com/en-us/graph/api/presence-get?view=graph-rest-beta&tabs=http
     */
    console.log("updatePresenceSubscription: " + this.dms.map(dm => dm.userId));
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

  // handleDisconnection() {
  //   for (const c of this.channels)
  //     c.clear()
  //   this.status = 'disconnected'
  //   this.onUpdateConnection.dispatch()
  // }

  // handleConnecting() {
  //   this.status = 'connecting'
  //   this.onUpdateConnection.dispatch()
  // }

  // async dispatchMessage(event) {
  //   const channel = this.findChannelById(event.channel)
  //   if (!channel)
  //     return

  //   switch (event.subtype) {
  //     case 'message_deleted': {
  //       if (event.previous_message.thread_ts) {
  //         // Emit event in thread if it is opened.
  //         const thread = channel.findThread(event.previous_message.thread_ts)
  //         if (thread)
  //           thread.deleteMessage(event.deleted_ts, event.deleted_ts)
  //       }
  //       // Emit event in channel if the message does not belong to a thread, or
  //       // if it is parent of a thread.
  //       if (event.previous_message.thread_ts === undefined ||
  //         event.previous_message.thread_ts === event.previous_message.ts)
  //         channel.deleteMessage(event.deleted_ts, event.deleted_ts)
  //       break
  //     }

  //     case 'message_changed': {
  //       // When changing a thread message due to replyCount change, Slack only
  //       // passes partial information.
  //       let isPartialChange = false
  //       if (event.message.thread_ts && event.message.thread_ts === event.message.ts) {
  //         const original = channel.findMessage(event.message.ts, event.message.ts)
  //         if (original && event.message.reply_count !== original.replyCount)
  //           isPartialChange = true
  //       }
  //       // For non-partial change, simply modify the message.
  //       if (!isPartialChange) {
  //         const modified = new TeamsMessage(this, event.message)
  //         await modified.fetchPendingInfo(this)
  //         if (modified.threadId) {
  //           // Emit event in thread if it is opened.
  //           const thread = channel.findThread(modified.threadId)
  //           if (thread)
  //             thread.modifyMessage(modified.id, modified.timestamp, modified)
  //         }
  //         // Emit event in channel if the message does not belong to a thread, or
  //         // if it is parent of a thread.
  //         if (!modified.threadId || modified.isThreadHead)
  //           channel.modifyMessage(modified.id, modified.timestamp, modified)
  //         break
  //       }
  //       // Else fallback to next stage.
  //     }

  //     case 'message_replied': {
  //       // Slack only pass partial information when a message is replied, so
  //       // find the original message and modify replyCount.
  //       const original = channel.findMessage(event.message.ts, event.message.ts)
  //       if (!original)
  //         break
  //       const partial = new TeamsMessage(this, event.message)
  //       await partial.fetchPendingInfo(this)
  //       original.isThreadParent = partial.isThreadParent
  //       original.replyCount = partial.replyCount
  //       original.replyUsers = partial.replyUsers
  //       // Emit for channel and thread.
  //       const thread = channel.findThread(partial.threadId)
  //       if (thread)
  //         thread.modifyMessage(original.id, original.timestamp, original)
  //       channel.modifyMessage(original.id, original.timestamp, original)
  //       break
  //     }

  //     default: {
  //       const message = new TeamsMessage(this, event)
  //       await message.fetchPendingInfo(this)
  //       if (message.threadId) {
  //         // Emit event in thread if it is opened.
  //         const thread = channel.findThread(message.threadId)
  //         if (thread)
  //           thread.dispatchMessage(message)
  //       }
  //       // Emit event in channel if the message does not belong to a thread, or
  //       // if it is parent of a thread.
  //       if (!message.threadId || message.isThreadHead)
  //         channel.dispatchMessage(message)
  //     }
  //   }
  // }

  // setReaction(add, event) {
  //   const channel = this.findChannelById(event.item.channel)
  //   if (!channel)
  //     return
  //   const reaction = new TeamsReaction(this, event.reaction, 1, [event.user])
  //   if (add)
  //     channel.reactionAdded(event.item.ts, event.item.ts, reaction)
  //   else
  //     channel.reactionRemoved(event.item.ts, event.item.ts, reaction)
  // }

  // setPin(isPinned, event) {
  //   if (event.item.type !== 'message')
  //     return
  //   const channel = this.findChannelById(event.item.channel)
  //   if (channel)
  //     channel.updateMessagePin(event.item.message.ts, event.item.message.ts, isPinned)
  // }

  // setStar(hasStar, event) {
  //   if (event.item.type !== 'message')  // Only support message for now.
  //     return
  //   const channel = this.findChannelById(event.item.channel)
  //   if (channel)
  //     channel.updateMessageStar(event.item.message.ts, event.item.message.ts, hasStar)
  // }

  // markRead(event) {
  //   const channel = this.findChannelById(event.channel)
  //   if (channel)
  //     channel.markRead()
  // }

  // reloadHistory(event) {
  //   // TODO Reload chat.
  //   const channel = this.findChannelById(event.channel)
  //   if (channel)
  //     channel.clear()
  // }

  // async joinChannel(event) {
  //   let channel
  //   if (event.type === 'group_open') {
  //     const group = (await this.rtm.webClient.conversations.info({ channel: event.channel })).channel
  //     channel = new TeamsChannel(this, group)
  //   } else {
  //     channel = new TeamsChannel(this, event.channel)
  //   }
  //   const i = bounds.gt(this.channels, channel, compareChannel)
  //   this.channels.splice(i, 0, channel)
  //   this.onAddChannel.dispatch(i, channel)
  // }

  // leaveChannel(event) {
  //   const index = this.channels.findIndex((c) => c.id == event.channel)
  //   if (index === -1)
  //     return
  //   this.onRemoveChannel.dispatch(index, this.channels[index])
  //   this.channels.splice(index, 1)
  // }

  // handlePresenceChange(event) {
  //   const user = this.findUserById(event.user)
  //   if (!user)
  //     return
  //   user.setAway(event.presence === 'away')
  //   const userChannel = this.findChannelByUserId(user.id)
  //   if (userChannel)
  //     userChannel.setAway(event.presence === 'away')
  // }

  // async openDM(event) {
  //   const channel = new TeamsDirectMessage(this, event)
  //   this.dms.unshift(channel)
  //   this.updatePresenceSubscription()
  //   this.onOpenDM.dispatch(0, channel)
  // }

  // async joinDM(us) {
  //   // TODO (fall2020): 
  //   //       Figure out how this actually works so we can replicate the functionality for MS Teams
  //   //       It looks like this comes into play when the user clicks "Direct Messages" in the channels
  //   //       panel and then clicks a user to initiate a new direct message.  It may also come into play 
  //   //       when a user initiates a direct message outside of Loung Lizard, but that is unconfirmed.
  //   //       Note that an experiment involving creating a new DM in a web browser suggests that Lounge
  //   //       Lizard does not detect that situation, though the new DM did eventually show up so maybe
  //   //       there is simply a long refresh interval.
  //   return await this.rtm.webClient.conversations.open({ return_im: true, users: us })
  // }

  // async closeDM(event) {
  //   const index = this.dms.findIndex((c) => c.id == event.channel)
  //   if (index === -1)
  //     return
  //   this.onCloseDM.dispatch(index, this.dms[index])
  //   this.dms.splice(index, 1)
  //   this.updatePresenceSubscription()
  // }

  // Save user for ID lookup
  saveUser(member) {
    return super.saveUser(new TeamsUser(this, member))
  }

  async fetchUser(id, isBot) {
    let user = this.findUserById(id)
    if (!user) {
      const userData = await this.apiHelper.getUser(id);
      user = this.saveUser(userData);
    }
    return user;
  }

  /***
   * TODO (fall2020):
   * In the slack client, this method is overridden to add the user's token
   * to the data that is written in the config file when serialize() is called
   * for an account.  At this point, it doesn't seem like we will need or want
   * to do that for Teams.  We will ultimately need to determine if there is 
   * anything here that we need to add to the standard set of items that are persisted.
   */
  // serialize() {
  //   const config = { token: this.rtm.webClient.token }
  //   return Object.assign(super.serialize(), config)
  // }

  async disconnect() {
    /***
     * TODO (fall2020):
     * Determine if we need to do anything here for MS Teams
     */
    // if (this.rtm.connected)
    //   this.rtm.disconnect()
  }

  async reload() {
    await this.updateChannels()
  }

  async getAllChannels() {
    return this.channels;
  }

  async getAllUsers() {
    return this.users;
  }

  async join(channel) {
    /*** TODO (fall2020):
     * Determine what, if anything, we need to do here
     */
    // await this.rtm.webClient.conversations.join({ channel: channel.id })
  }

  async leave(channel) {
    /***
     * TODO (fall2020):
     * Determine what, if anything, we need to do here
     */
    // if (channel.type === 'channel')
    //   await this.rtm.webClient.conversations.leave({ channel: channel.id })
    // else
    //   await this.rtm.webClient.conversations.close({ channel: channel.id })
  }
}

module.exports = TeamsAccount
