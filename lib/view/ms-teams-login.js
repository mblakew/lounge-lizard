const querystring = require('querystring')
const url = require('url')
const {
  client_id,
  auth_uri,
  scope
} = require('../service/teams/secrets.json');

const gui = require('gui')

const configStore = require('../controller/config-store')
const accountManager = require('../controller/account-manager')
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
    // function required by window manager
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