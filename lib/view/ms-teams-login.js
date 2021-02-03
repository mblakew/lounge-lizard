const fs = require('fs')
const qs = require('querystring')
const path = require('path')
const url = require('url')

const gui = require('gui')
const opn = require('opn')
const handlebars = require('./chat/handlebars')

const accountManager = require('../controller/account-manager')
const imageStore = require('../controller/image-store')
const windowManager = require('../controller/window-manager')
const { theme } = require('../controller/theme-manager')

class MsTeamsLogin {
  constructor(window) {
    this.window = window

    this.view = gui.Container.create()
    this.view.setStyle({ flex: 1 })

    this.browser = gui.Browser.create({
      devtools: true,
      contextMenu: true,
      allowFileAccessFromFiles: true,
      hardwareAcceleration: false
    })
    this.browser.setStyle({ flex: 1 })
    this.browser.setBindingName('ll')

    this.browser.onStartNavigation = (browser, url) => {
      browser.executeJavaScript('window.location.href', this._bruh.bind(this))
    }

    this.view.addChildView(this.browser)
  }

  // TODO: rename this function.
  _bruh(success, result) {
    if (!success) return
    if (typeof result === "string" && /^https:\/\/teams.microsoft.com\/go\?code=/.test(result)) {
      console.log('\n\nTHE CODE IS:', result.match(/(?<=code=)(.*?)(?=&)/gi)[0]) // eventually write this token into config automatically
      // this.browser.stop()
      // this.window.close()
    }
  }

  load() {

    // https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=55a80a30-eea6-455a-929e-2e1a7b6cf8f3&response_type=code&redirect_uri=https://teams.microsoft.com/go&response_mode=query&scope=openid%20offline_access%20https%3A%2F%2Fgraph.microsoft.com%2Fmail.read&state=d0a98567-5920-48a4-98d6-154eb6a3da3d
    //                    https://login.microsoftonline.com/common/oauth2/authorize?response_type=code&client_id=5e3ce6c0-2b1f-4285-8d4b-75ee78787346&redirect_uri=https://teams.microsoft.com/go&state=d0a98567-5920-48a4-98d6-154eb6a3da3d&client-request-id=698f2a0f-5b79-4cec-8920-b24984121613&x-client-SKU=Js&x-client-Ver=1.0.9&nonce=d9b03da4-38c6-4f7f-98a3-04eeede598c6&scope=offline_access%20user.read%20mail.read
    const scope = [
      'user.read',
      'offline_access',
      'openid',
      'profile',
      'email',
      'chat.readwrite',
      'presence.read.all'
    ].map(perm => `https%3A%2F%2Fgraph.microsoft.com%2F${perm}`).join('%20')

    console.log('scope values:', scope)

    this.browser.loadURL(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=55a80a30-eea6-455a-929e-2e1a7b6cf8f3&response_type=code&redirect_uri=https://teams.microsoft.com/go&response_mode=query&scope=${scope}&state=d0a98567-5920-48a4-98d6-154eb6a3da3d`)
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
      const html = pageTemplate({ messageList, messages })
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

    const html = threadsPageTemplate({ threads })
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
