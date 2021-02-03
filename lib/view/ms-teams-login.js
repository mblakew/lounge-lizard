const fs = require('fs')
const querystring = require('querystring')
const path = require('path')
const url = require('url')
const {
  client_id,
  auth_uri,
  scope
} = require('../service/teams/secrets.json');

const gui = require('gui')
const opn = require('opn')
const handlebars = require('./chat/handlebars')

const configStore = require('../controller/config-store')
const accountManager = require('../controller/account-manager')
const imageStore = require('../controller/image-store')
const windowManager = require('../controller/window-manager')
const {
  theme
} = require('../controller/theme-manager');
const TeamsApiHelper = require('../service/teams/teams-api-helper');

class MsTeamsLogin {
  constructor(window, createAccount) {
    this.createAccount = createAccount
    this.window = window
    this.apiHelper = new TeamsApiHelper('')

    this.view = gui.Container.create()
    this.view.setStyle({
      flex: 1
    })

    this.browser = gui.Browser.create({
      devtools: true,
      contextMenu: true,
      allowFileAccessFromFiles: true,
      hardwareAcceleration: false
    })
    this.browser.setStyle({
      flex: 1
    })
    this.browser.setBindingName('ll')

    this.browser.onStartNavigation = (browser, url) => {
      browser.executeJavaScript('window.location.href', this.authCodeCallback.bind(this))
    }

    this.view.addChildView(this.browser)
  }

  async authCodeCallback(success, result) {
    if (!success) return
    if (typeof result === "string" && /^https:\/\/teams.microsoft.com\/go\?code=/.test(result)) {

      const code = result.match(/(?<=code=)(.*?)(?=&)/gi)[0]
      this.apiHelper.code = code

      await this.apiHelper.refreshToken()
      const accessToken = this.apiHelper.getAccessToken()

      console.log('\n\nthe code:', this.apiHelper.code, '\n\n+++++++++++++++++++++++++++++++++++++++++')
      console.log('\n\naccess token:', this.apiHelper.getAccessToken(), '\n\n-----------------------------------------\n\n')

      const teams = await this.apiHelper.getJoinedTeams()

      for (const team of teams) {
        console.log('team:', team, '\n')
        if (accountManager.findAccountById(team.id) === undefined) {
          accountManager.addAccount(this.createAccount(team.id, team.displayName, accessToken))
        }
      }

      accountManager.serialize()
      configStore.serialize()

      this.browser.stop()
      this.window.close()
    }
  }

  load() {
    const encodedScope = scope.map(perm => `https%3A%2F%2Fgraph.microsoft.com%2F${perm}`).join('%20')
    this.browser.loadURL(auth_uri.replace("{{client_id}}", client_id).replace("{{scope}}", encodedScope))
  }

  unload() {

  }

  setLoading(isLoading = true) {
    if (isLoading) this.unload()
    // Browser must be displayed at last to avoid extra resize event.
    if (isLoading) {
      this.browser.setVisible(false)
      //  this.replyBox.setVisible(false)
      this.loadingIndicatorWrapper.setVisible(true)
    } else {
      this.loadingIndicatorWrapper.setVisible(false)
      // this.replyBox.setVisible(true)
      this.browser.setVisible(true)
    }
    // this.replyEntry.setEnabled(!isLoading)
    // if (!isLoading) this.replyEntry.focus()
  }

  async loadChannel(messageList) {
    this.unload()
    // Show progress bar if we need to fetch messages.
    if (!messageList.messagesReady) this.setLoading()
    this.messageList = messageList
    this.subscription = {
      onMessage: messageList.onMessage.add(this._newMessage.bind(this)),
      onDeleteMessage: messageList.onDeleteMessage.add(this._deleteMessage.bind(this)),
      onModifyMessage: messageList.onModifyMessage.add(this._modifyMessage.bind(this))
    }
    // Make sure messages are loaded before loading the view.
    this.messageList.startReceiving()
    const messages = await messageList.readMessages()
    this.messagesLoaded = false
    // Start showing the messages.
    if (messageList === this.messageList) {
      //this.replyEntry.setText(messageList.draft ? messageList.draft : '')
      this._adjustEntryHeight()
      const html = pageTemplate({
        messageList,
        messages
      })
      if (process.env.LL_DEBUG === '1') fs.writeFileSync('page.html', html)
      this.loadedTimes++
      this.browser.loadHTML(html, messageList.account.url)
    }
  }

  unloadThreads() {
    if (!this.threads || !this.threadBindings) return
    for (let binding of this.threadBindings) binding.detach()
  }

  async loadThreads(threads) {
    this.unload()
    //console.log('loading threads')
    this.threads = threads
    this.threadBindings = []
    this.messagesLoaded = false
    this._adjustEntryHeight()

    //subscriptions
    for (let thread of threads) {
      thread.isReceiving = true
      this.threadBindings.push(thread.onMessage.add(this._newThreadMessage.bind(this)))
      this.threadBindings.push(thread.onModifyMessage.add(this._modifyMessage.bind(this)))
      this.threadBindings.push(thread.onDeleteMessage.add(this._deleteMessage.bind(this)))
    }

    const html = threadsPageTemplate({
      threads
    })
    if (process.env.LL_DEBUG === '1') fs.writeFileSync('threadsPage.html', html)
    this.loadedTimes++
    const domain = threads[0].account.url
    this.browser.loadHTML(html, domain)
    this.replyEntry.setEnabled(false)
  }
}

// Register ll:// protocol to work around CORS problem with file:// protocol.
gui.Browser.registerProtocol('ll', urlStr => {
  const parsedUrl = url.parse(urlStr)
  if (parsedUrl.host !== 'file') return gui.ProtocolStringJob.create('text/plain', 'Unsupported type')
  const query = querystring.parse(parsedUrl.query)
  return gui.ProtocolFileJob.create(query.path)
})

module.exports = MsTeamsLogin