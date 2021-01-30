const gui = require('gui')
const keytar = require('keytar')

// const {WebClient} = require('@slack/client')

const MsTeamsLogin = require('../../view/ms-teams-login')
const Service = require('../../model/service')
const TeamsAccount = require('./teams-account')

const FETCH_BUTTON_TEXT = 'Fetch tokens from official Teams app'

class TeamsService extends Service {
  constructor() {
    super('teams', 'Teams')
  }

  login() {
    if (!this.loginWindow) {
      this.createLoginWindow()
      this.loginWindow.center()
    }
    this.loginWindow.activate()
  }

  createAccount(id, name, token) {
    return new TeamsAccount(this, id, name, token)
  }

  async loginWithToken(token, button) {
    // // Set loading information.
    // if (button) {
    //   button.setTitle("Loading...")
    //   button.setEnabled(false)
    // } else {
    //   this.loginWindow.setContentView(gui.Label.create('Loading...'))
    // }
    // try {
    //   // Test the token.
    //   const client = new WebClient(token)
    //   const data = await client.auth.test()
    //   this.createAccount(data.team_id, data.team, token)
    //   // Succeeded.
    //   if (button) {
    //     this.loginWindow.getContentView().removeChildView(button)
    //     this.adujstLoginWindowSize()
    //   } else {
    //     this.loginWindow.close()
    //   }
    // } catch (e) {
    //   // Report error.
    //   const message = e.message.startsWith('An API error occurred: ') ?  e.message.substr(23) : e.message
    //   if (button) {
    //     button.setEnabled(true)
    //     button.setTitle(`Retry (${message})`)
    //   } else {
    //     this.loginWindow.setContentView(gui.Label.create(message))
    //   }
    // }
  }

  createLoginWindow() {
    this.loginWindow = gui.Window.create({})
    this.loginWindow.setTitle("Login to Microsoft Teams")
    this.loginWindow.onClose = () => this.loginWindow = null

    const view = new MsTeamsLogin(this.loginWindow)
    this.loginWindow.setContentView(view.view)
    this.loginWindow.setContentSize({ width: 400, height: 600 })

    view.load()
  }

  adujstLoginWindowSize() {
    this.loginWindow.setContentSize({
      width: 400,
      height: this.loginWindow.getContentView().getPreferredHeightForWidth(400),
    })
  }

  createRow(contentView) {
    const row = gui.Container.create()
    row.setStyle({flexDirection: 'row', marginBottom: 5})
    contentView.addChildView(row)
    return row
  }

  async exchangeToken(teamInput, emailInput, passInput, loginButton) {
    // loginButton.setEnabled(false)
    // loginButton.setTitle('Loading...')
    // const client = new WebClient()
    // require('./private-apis').extend(client)
    // try {
    //   const {team_id} = await client.auth.findTeam({domain: teamInput.getText()})
    //   const {token} = await client.auth.signin({
    //     email: emailInput.getText(),
    //     password: passInput.getText(),
    //     team: team_id,
    //   })
    //   this.loginWithToken(token)
    // } catch (e) {
    //   const message = e.message.startsWith('An API error occurred: ') ?  e.message.substr(23) : e.message
    //   loginButton.setEnabled(true)
    //   loginButton.setTitle(`Retry (${message})`)
    // }
  }

  async fetchSlackTokens(fetchButton) {
  //   fetchButton.setEnabled(false)
  //   fetchButton.setTitle('Loading...')
  //   let teams = []
  //   try {
  //     const tokens = JSON.parse(await keytar.getPassword('Slack', 'tokens'))
  //     for (const teamId in tokens) {
  //       const token = tokens[teamId].token
  //       const client = new WebClient(token)
  //       try {
  //         const info = await client.auth.test()
  //         teams.push({user: info.user, name: info.team, token})
  //       } catch (e) {
  //       }
  //     }
  //   } catch (e) {
  //     fetchButton.setTitle('Retry (Failed to fetch tokens)')
  //     return
  //   } finally {
  //     fetchButton.setEnabled(true)
  //   }
  //   if (teams.length == 0) {
  //     fetchButton.setTitle('Retry (No valid Slack tokens found)')
  //     return
  //   }
  //   for (const team of teams) {
  //     const button = gui.Button.create(`Login to ${team.name} as ${team.user}`)
  //     button.setStyle({
  //       width: '100%',
  //       marginTop: 10,
  //     })
  //     button.onClick = this.loginWithToken.bind(this, team.token, button)
  //     this.loginWindow.getContentView().addChildView(button)
  //   }
  //   fetchButton.setVisible(false)
  //   this.adujstLoginWindowSize()
  }
}

module.exports = new TeamsService
