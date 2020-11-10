const Channel = require("../../model/channel");
const TeamsMessage = require("./teams-message");
const TeamsThread = require("./teams-thread");
const emoji = require("./emoji.json");
const { parseEmojiFromMessage } = require("./message-parser");

class TeamsChannel extends Channel {
  constructor(account, event) {
    super(account, 'channel', event.id, event.displayName)

    this.description = event.description;
    this.isDefault = (event.displayName === "General");   // will this always be the case?
    this.isMember = true;   // For now, just assume that  the user is member all channels we got for them
  }

  openThreadImpl(id) {
    const threadMessages = this.messages.filter(m => m.id === id)
    return new TeamsThread(this, threadMessages[0])
  }


  async getProfile(id, timestamp) {
    const message = this.findMessage(id, timestamp)
    this.updateProfile(id, timestamp)
    return message
  }

  // As of September 1, 2020, Teams does not support pinning messages.
  // See https://microsoftteams.uservoice.com/forums/555103-public/suggestions/16911532-ability-to-pin-message-files-articles-shared-withi
  async pinMessage(id, timestamp, isPinned, channelId = this.id){
    throw new Error('Message pinning is not supported for MS Teams');
  }

  //view pinned messages, only works at console atm
  async viewPinned(id, channelId = this.id){
    throw new Error('Message pinning is not supported for MS Teams');
  }

  async setMessageStar(id, timestamp, hasStar, channelId = this.id) {
    throw new Error('Saving messages is not supported for MS Teams');
  }

  async openReactPicker(id, timestamp, channelId = this.id) {
    /***
     * TODO (fall2020): 
     * Determine if MS Teams (and the Graph API) support custom emoji and, 
     * if so, add code below to get custom emoji list
     */
    const message = this.findMessage(id, timestamp);

    const size = 22;
    const nativeEmoji = Object.keys(emoji).map(e => {
      return { name: e, x: emoji[e].x * size, y: emoji[e].y * size, size };
    });

    if (message) {
      return this.showReactPicker(id, timestamp, {
        customEmoji: [],
        nativeEmoji: nativeEmoji
      });
    }
  }

  async setMessageReaction(id, timestamp, name, reacted, channelId = this.id) {
    throw new Error('Reacting to messages is not supported for MS Teams.');
  }

  /***
   * TODO (fall2020):
   * Slack client must always return messages in reverse chronological order because
   * the SlackChannel implementation simply reverses the retrieved list of messages
   * for a channel without attempting to sort it based on any property of messages.
   * For now, we can do the same for MS Teams but ultimately need to confirm this behavior
   * and either leave the code below as-is, or change to sort based on some message property
   * such as last modified time.
   */
  async readMessagesImpl() {
    const messages = await this.account.apiHelper.getChannelMessages(this.account.id, this.id);
    const smsgs = messages.reverse().map((m) => new TeamsMessage(this.account, m))
    smsgs.forEach(m => {
      m.fetchPendingInfo(this.account);
    });

    return smsgs
  }

  async sendMessage(text) {
    text = parseEmojiFromMessage(await this.parseTags(text), true)

    const response = await this.account.apiHelper.sendChannelMessage(this.account.id, this.id, text);

    const message = new TeamsMessage(this.account, response)
    await message.fetchPendingInfo(this.account)
    this.dispatchMessage(message)
  }

  //replace @tags with appropriate tag syntax
  async parseTags(text){
    /***
     * TODO (fall2020):
     * Determine what needs to be done here.  At the very least, Teams
     * does not seem to support the @everyone or @here tags.
     */
    if (text.includes('@')){
      //for special mentions
      text = text.replace('@everyone', '<!everyone>')
      text = text.replace('@here', '<!here>')
      text = text.replace('@channel', '<!channel>')

      let search_results = null
      //for user mentions
      if(search_results = text.match(/@[a-z0-9]+/gi)){
        for(let result of search_results){
          let name = result.substring(1)
          let id = this.account.findUserIdByName(name)
          if(id)
            text = text.replace(result, `<@${id}>`)
          else{ //search again for usernames with a space between names
            let search_with_space = null
            if (search_with_space = text.match(/@[a-z0-9]+ [a-z0-9]+/gi)){
              for(let result of search_with_space){
                name = result.substring(1)
                id = this.account.findUserIdByName(name)
                if(id)
                  text = text.replace(result, `<@${id}>`)
              }
            }
          }
        }
      }
    }
    return text
  }

  async notifyReadImpl() {
    if (!this.latestTs)
      return
    /***
     * TODO (fall2020):
     * Determine what to do here...
     * On initial inspection, the MS Graph API does not seem to provide a way to mark 
     * a channel as "read".
     */
  }
}

module.exports = TeamsChannel
