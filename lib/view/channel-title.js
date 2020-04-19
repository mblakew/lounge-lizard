const gui = require('gui')

const {WebClient} = require('@slack/client')

const NORMAL_COLOR = '#C1C2C6'
const HOVER_COLOR = '#FFFFFF'
const PADDING = 5

const CHANNEL_TITLE_FONT = gui.Font.default().derive(2, 'normal', 'normal')
const CHANNEL_TITLE_FONT_SIZE = CHANNEL_TITLE_FONT.getSize()
const {theme} = require('../controller/theme-manager')

class ChannelTitle {
  constructor(title, parent) {
    this.title = title
    this.parent = parent
    this.view = gui.Container.create()
    this.view.setMouseDownCanMoveWindow(false)
    this.view.setStyle({height: CHANNEL_TITLE_FONT_SIZE + 2 * PADDING})
    this.view.onDraw = this.draw.bind(this)

    this.hover = false
    this.isSelected = false
    this.view.onMouseEnter = () => {
      this.hover = true
      this.view.schedulePaint()
    }
    this.view.onMouseLeave = () => {
      this.hover = false
      this.view.schedulePaint()
    }
    // this.view.onMouseUp = () =>{
    //   this.parent.selectChannelTitle(this)
    // }

    this.view.onMouseUp = this._click.bind(this)
  }

  _click(view, event) {
    // Click on the channel item.
    if (event.button === 1) {
      // Left click to open channel.
      this.parent.selectChannelTitle(this)
    } else {  // for GTK+ button could be 3 for trackpad right click.
      // Right click to show context menu.
      if (!this.menu) {
        // const leaveLabel = this.channel.type === 'channel' ? 'Leave channel'
        //                                                    : 'Close direct message'												   
        this.menu = gui.Menu.create([
          { label: 'Create new channel', onClick: this._popupNewChannel.bind(this) },
          // { label: leaveLabel, onClick: this._leave.bind(this) },
		  // { label: 'Show users', onClick: this._popupUsers.bind(this) },
        ])
      }
      this.menu.popup()
    }
  }

  _popupNewChannel() {
    this.createChannel();
    // const bounds = this.parent.mainWindow.chatBox.view.getBounds()
    // new ChatWindow(this.channel, bounds)
  }

  _popupUsers() {
    this.getUsers()
    }

    createRow(contentView) {
      const row = gui.Container.create()
      row.setStyle({flexDirection: 'row', marginBottom: 5})
      contentView.addChildView(row)
      return row
    }
  

    createChannel() {
      // const s = gui.Scroll.create()
      // s.setStyle({flex: 1})
      //   s.setScrollbarPolicy('never', 'automatic')
      
      // const DESP_FONT = '#FFFFFF'
      // const HOVER_BACKGROUND = '#2B2E3B'
      // const PADDING = 10

      // const bounds = Object.assign(this.view.getBounds(), {x: 0, y: 0})

      // const attributes = { font: this.font, color: DESP_FONT }
      // bounds.x = PADDING
      // bounds.y = PADDING
  

      const channelWindow = gui.Window.create({})
      channelWindow.center()
      channelWindow.activate()

      channelWindow.setTitle('Create new channel')
      // channelWindow.onClose = () => channelWindow = null

      const contentView = gui.Container.create()
      contentView.setStyle({padding: 10})
      channelWindow.setContentView(contentView)
  

      // painter.drawText("Create a new channel", bounds, attributes)
      // font: gui.Font.create('Helvetica', 35, 'normal', 'normal'),
      // color: '#FFF',
      // align: 'center',
      // valign: 'center',
      // painter.drawText("Create a new channel", bounds, {font: DESP_FONT})

// label11.//
      const row1 = this.createRow(contentView)
      const label11 = gui.Label.create('Name')
      row1.addChildView(label11)
      // const labelWidth = label11.getBounds().width + 5
      label11.setAlign('start')
      // label11.setStyle({minWidth: labelWidth})

      const row2 = this.createRow(contentView)
      const channelName = gui.Entry.create()
      channelName.setStyle({flex: 1})
      row2.addChildView(channelName)

      // const row2 = this.createRow(contentView)
      // const label21 = gui.Label.create('Description')
      // label21.setAlign('start')
      // label21.setStyle({minWidth: labelWidth})
      // row2.addChildView(label21)
      // const channelDescription = gui.Entry.create()
      // channelDescription.setStyle({flex: 1})
      // row2.addChildView(channelDescription)

      // const row3 = this.createRow(contentView)
      // const label31 = gui.Label.create('Add people')
      // label31.setAlign('start')
      // // label31.setStyle({minWidth: labelWidth})
      // row3.addChildView(label31)

      // const row4 = this.createRow(contentView)
      // const channelUsers = gui.Entry.create()
      // channelUsers.setStyle({flex: 1})
      // row4.addChildView(channelUsers)
  
      const doneButton = gui.Button.create('Done')
      // doneButton.setStyle("help-button")
      doneButton.setStyle({marginBottom: 10})
      doneButton.onClick = this.createConvo.bind(this, channelName, doneButton)
      // passInput.onActivate = this.createConvo.bind(this, channelName, channelUsers, doneButton)
      contentView.addChildView(doneButton)
  

    
      // channelWindow.setContentView(contentView)
      channelWindow.setContentSize({ width: 500, height: 350 })
      // s.setContentView(contentView)
      // s.setContentSize({ width: 750, height: 500 })
    
      // channelWindow.center()
      // channelWindow.activate()

      // painter.drawText('Create new channel', {font: CHANNEL_TITLE_FONT})
    
    }

    async both(channelName, doneButton) {
      this.createChannel(channelName, doneButton)
      // this.add2Channel(butt)

    }

    async createConvo(channelName, doneButton)  {
      doneButton.setEnabled(false)
      doneButton.setTitle('Loading...')
// adding usrs this way is depreciated must use conversations.invite

      await this.parent.account.createChannel(channelName.getText())
      // console.log()
      // this.parent.account.inviteChannel(newchannel.id, channelUsers.getText())
      // console.log(newchannel)
      // this.parent.account.reload()
      // this.parent.mainWindow.channelsPanel.selectChannelById(newchannel.id)
      // this.add2Channel();
      // return newchannel.id




    }
  
add2Channel() {
  console.log("her?")
  const addWindow = gui.Window.create({})
  addWindow.center()
  addWindow.activate()
  addWindow.setTitle('Add people')
  // channelWindow.onClose = () => channelWindow = null

  const contView = gui.Container.create()
  contView.setStyle({padding: 10})
  addWindow.setContentView(contView)


  // const row3 = this.createRow(contentView)
  // const label31 = gui.Label.create('Add people')
  // label31.setAlign('start')
  // // label31.setStyle({minWidth: labelWidth})
  // row3.addChildView(label31)

  // const row4 = this.createRow(contentView)
  // const channelUsers = gui.Entry.create()
  // channelUsers.setStyle({flex: 1})
  // row4.addChildView(channelUsers)

}

  draw(view, painter, dirty) {
    const bounds = {
      x: 0,
      y: PADDING,
      height: CHANNEL_TITLE_FONT_SIZE + PADDING,
      width: view.getBounds().width,
    }
    const attributes = {
      font: CHANNEL_TITLE_FONT,
      color: this.hover ? HOVER_COLOR : NORMAL_COLOR,
    }
    painter.drawText(this.title, bounds, attributes)
  }

  select(){
    this.isSelected = true
    this.view.schedulePaint()
  }

  deselect(){
    if(!this.isSelected)
      return
    this.isSelected = false
    this.view.schedulePaint()
  }
}

module.exports = ChannelTitle
