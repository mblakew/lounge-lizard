const Account = require('../../model/account')
const TeamsMessage = require('./teams-message')
const TeamsChannel = require('./teams-channel')
const TeamsDirectMessage = require('./teams-direct-messsage')
const TeamsUser = require('./teams-user')
const TeamsApiHelper = require('./teams-api-helper')
const configStore = require('../../controller/config-store')
const accountManager = require('../../controller/account-manager')

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

const userPresenceMap = {
  Available: "Available",
  AvailableIdle: "Idle",
  Away: "Away",
  BeRightBack: "Be Right Back",
  Busy: "Busy",
  BusyIdle: "Idle",
  DoNotDisturb: "Do Not Disturb",
  Offline: "Offline",
  PresenceUnknown: "Unknown"
}

class TeamsAccount extends Account {
  constructor(service, id, name, token) {
    super(service, id, name)

    this.setupTeamsClient(token);
  }

  setupTeamsClient(token) {
    this.apiHelper = new TeamsApiHelper(token)


    this.ready();

    // Indicate whether this is reconnection.
    this.isReconnect = false

    // Need to invoke this to get the UI started, but doesn't seem like we need
    // something external to tell us when it is ok to invoke this.
    this.handleConnection();

    // Register event handlers for any events that can be raised by the API Helper
    // and which will be handled here.  See the SlackAccount class for a complete list 
    // of events for which the Slack client can received updates from the server.
    this.apiHelper.on(this.apiHelper.events.MESSAGE, this.dispatchMessage.bind(this))
    this.apiHelper.on(this.apiHelper.events.TEST_EVENT, this.handleTestEvent.bind(this));
    this.apiHelper.on(this.apiHelper.events.TEST_EVENT_WITH_PARAM, this.handleTestEventWithParam.bind(this, 77));
  }

  // This is just an example of an event handler
  handleTestEvent(eventParam) {
    console.log("Test event");
    console.log(eventParam);
  }

  // This is just an example of an event handler with an additional constant parameter
  // that is defined when the event handler is registered.
  handleTestEventWithParam(myParam, eventParam) {
    console.log("Test event with param");
    console.log("My param: " + myParam);
    console.log("Event param:" + eventParam);
  }

  async ready() {

    this.onUpdateInfo.dispatch(this)

    // Fetch all users in current team
    const members = await this.apiHelper.getTeamMembers(this.id);
    members.forEach(m => this.saveUser(m))

    // Current user
    const currentUser = await this.apiHelper.getCurrentUser();
    this.currentUserId = currentUser.id;
    this.currentUserName = currentUser.displayName;
    // Fetch channels.
    await this.updateChannels()
  }

  async updateChannels() {
    const teamsChannels = await this.apiHelper.getChannels(this.id);

    this.channels = teamsChannels
      .map((c) => new TeamsChannel(this, c))
      .sort(compareChannel)

    const teamsChats = await this.apiHelper.getChats();
    const chatsWithMembersPromise = teamsChats.map(async c => {
      const chatMembers = await this.apiHelper.getChatMembers(c.id);

      // Chat member list includes current user, so need to filter that out here...
      const filteredChatMembers = chatMembers.filter(m => !(m.userId === this.currentUserId))

      const chatMemberIds = filteredChatMembers.map(m => {
        return m.userId
      })
      const chatMemberPresence = await this.apiHelper.getPresencesByUserId(chatMemberIds)

      return {
        id: c.id,
        topic: c.topic,
        createdDateTime: c.createdDateTime,
        lastUpdatedDateTime: c.lastUpdatedDateTime,
        memberName: filteredChatMembers.map(m => {
          return m.displayName
        }),
        memberId: chatMemberIds,
        memberPresence: chatMemberPresence
      };
    });

    const chatsWithMembers = await Promise.all(chatsWithMembersPromise).then(r => {
      return r;
    });

    this.dms = chatsWithMembers.map((c) => new TeamsDirectMessage(this, c))

    // Notify.
    this.channelsLoaded()
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
    else // all connections are re-connect except for the first one.
      this.isReconnect = true
  }

  async dispatchMessage(event) {
    const channel = this.findChannelById(event.channel)
    if (!channel)
      return

    const message = new TeamsMessage(this, event.message)

    // Emit event in channel if the message does not belong to a thread, or
    // if it is parent of a thread.
    if (!message.threadId || message.isThreadHead) {
      channel.dispatchMessage(message)
    }
  }

  async joinDM(us) {
    const channel = this.findChannelByUserId(us)
    return channel ? channel.id : null;
  }

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

  serialize() {
    // Include current refresh token when this object is serialized
    const config = {
      token: this.apiHelper.accessToken
    }
    return Object.assign(super.serialize(), config)
  }

  async disconnect() {
    // Nothing to do here but we must override the disconnect method from the 
    // base class to avoid errors when the user disconnects from an account.
  }

  async reload() {
    await this.updateChannels()
  }

  async getAllChannels() {
    return this.channels;
  }

  // For MS Teams, it seems that all members of the team are automatically members of all channels in the team
  async getChannelMembers(channelId) {
    const channel = this.findChannelById(channelId)

    if (channel && channel.type === 'dm') {
      // If "channel" is a direct message/chat, just return the participating users
      const chatMembers = channel.memberIds.map(u => this.findUserById(u))
      return chatMembers
    } else {
      // otherwise, return all users in the team
      return this.getAllUsers();
    }
  }

  async getUserPresence(userId) {
    const userPresence = await this.apiHelper.getUserPresence(userId)

    if (userPresence && userPresence.availability) {
      return userPresenceMap[userPresence.availability]
    } else {
      return null
    }
  }

  async join(channel) {
    /***
     * MS Teams does not have the concept of joining a channel the same way that Slack does.
     * In MS Teams, a channel is either available to the user or it is not.  In the MS Teams
     * application, a user may show and hide channels and support for that functionality could 
     * be added to Lounge Lizard in the future.
     * 
     * In the meantime, this method must be overridden because otherwise an exception is thrown 
     * by this method in the base class
     */
  }

  async leave(channel) {
    /***
     * MS Teams does not have the concept of leaving a channel the same way that Slack does.
     * In MS Teams, a channel is either available to the user or it is not.  In the MS Teams
     * application, a user may show and hide channels and support for that functionality could 
     * be added to Lounge Lizard in the future.
     * 
     * In the meantime, this method must be overridden because otherwise an exception is thrown 
     * by this method in the base class
     */
  }
}

module.exports = TeamsAccount