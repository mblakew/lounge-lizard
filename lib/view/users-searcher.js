const gui = require('gui')

const ITEM_HEIGHT = 50
const SEPARATOR_COLOR = '#E8E8E8'
const FOCUS_BACKGROUND = '#ECF5FB'
const PADDING = 5

const NAME_FONT = gui.Font.default().derive(0, 'bold', 'normal')
const DESP_FONT = gui.Font.default().derive(2, 'normal', 'normal')

/***
 * TODO (fall2020):
 * In its current implementation, this class is tighly coupled to the user
 * JSON that is returned from the Slack API.  It needs to be refactored to 
 * work with the service-agnostic User model instead.
 */
class UsersSearcher {
  constructor(mainWindow) {
    this.mainWindow = mainWindow
    this.members = []

    this.view = gui.Container.create()
    this.view.setMouseDownCanMoveWindow(false)
    this.view.setBackgroundColor('#FFF')
    this.view.setStyle({flex: 1, padding: 20})

    this.entry = gui.Entry.create()
    this.entry.setStyle({width: '100%', marginBottom: 20})
    this.entry.onTextChange = this.onTextChange.bind(this)
    this.view.addChildView(this.entry)

    this.scroll = gui.Scroll.create()
    this.scroll.setStyle({flex: 1})
    this.scroll.setScrollbarPolicy('never', 'automatic')
    this.contentView = gui.Container.create()
    this.contentView.onDraw = this.draw.bind(this)
    this.scroll.setContentView(this.contentView)
    this.view.addChildView(this.scroll)

    this.hoverItem = null
    this.contentView.onMouseMove = this.onMouse.bind(this)
    this.contentView.onMouseEnter = this.onMouse.bind(this)
    this.contentView.onMouseLeave = this.onMouse.bind(this)
    this.contentView.onMouseUp = this.onClick.bind(this)
  }

  unload() {
    this.entry.setText('')
    this.account = null
    this.allUsers = []
    this.members = []
    this.view.setVisible(false)
    this.updateSize()
  }

// edit this to be users
  loadUsers(account, members) {
    this.account = account
    this.allUsers = members
    this.members = members
    this.view.setVisible(true)
    this.entry.focus()
    this.updateSize()
  }

  applyFilter(filter) {
    this.members = this.allUsers.filter(filter)
    this.updateSize()
  }

  updateSize() {
    this.scroll.setContentSize({
      width: this.scroll.getBounds().width,
      height: this.members.length * ITEM_HEIGHT,
    })
  }

  draw(view, painter, dirty) {
    const width = view.getBounds().width
    const start = Math.floor(dirty.y / ITEM_HEIGHT)
    const end = Math.floor(dirty.y + dirty.height / ITEM_HEIGHT)
    for (let i = start; i <= end; ++i) {
      const member = this.members[i]
      if (!member)
        break
      // Focus ring.
      if (i === this.hoverItem) {
        painter.setColor(FOCUS_BACKGROUND)
        painter.fillRect({x: 0, y: i * ITEM_HEIGHT, width, height: ITEM_HEIGHT})
      }
      // Draw name.
      const bounds = {
        x: PADDING,
        y: i * ITEM_HEIGHT + PADDING,
        width: width - PADDING * 2,
        height: 20
      }
      // is user private?
      const prefix = '@'
      painter.drawText(prefix + member.name, bounds, {font: NAME_FONT})
      // Description.
      bounds.y += 20
      // trying to get the real name
      painter.drawText(String(member.realName), bounds, {font: DESP_FONT})
      // Seperator.
      if (i !== this.members.length - 1) {
        const y = (i + 1) * ITEM_HEIGHT
        painter.setStrokeColor(SEPARATOR_COLOR)
        painter.beginPath()
        painter.moveTo({x: 0, y})
        painter.lineTo({x: width, y})
        painter.stroke()
      }
    }
  }

  onMouse(view, event) {
    const hover = Math.floor(event.positionInView.y / ITEM_HEIGHT)
    if (this.hoverItem === hover)
      return
    const rect = {x: 0, y: 0, width: view.getBounds().width, height: ITEM_HEIGHT}
    if (this.hoverItem !== null)
      this.contentView.schedulePaintRect(Object.assign(rect, {y: this.hoverItem * ITEM_HEIGHT}))
    this.hoverItem = hover
    this.contentView.schedulePaintRect(Object.assign(rect, {y: this.hoverItem * ITEM_HEIGHT}))
  }

  async onClick(view, event) {
    const i = Math.floor(event.positionInView.y / ITEM_HEIGHT)
    const member = this.members[i]
    if (member) {
      if (this.account.findChannelByUserId(member.id)) {
        let channel = await this.account.joinDM(member.id)
        this.mainWindow.channelsPanel.selectChannelById(channel)
      } else if (this.account.canCreateDm) {
        /***
         * The code in this block remains tightly coupled to the Slack client (primarily
         * because, in the case of the Slack client, joinDMAsync is returning a promise that
         * eventually resolves to a direct message) but because the MS Graph API does
         * not seem to support creating a new DM ("chat" in MS Graph API parlance), the code below
         * is never executed for a Teams account.
         */
        
        let direct_message = this.account.joinDMAsync(member.id)
        let acc = this.account
        direct_message.then(function(dt) {
          acc.reload().then(function() {
            this.mainWindow.channelsPanel.selectChannelById(dt.channel.id)
          }.bind(this))
        }.bind(this))
      }
    }
  }

  onTextChange(view) {
    const text = view.getText().toLowerCase()
    this.applyFilter((c) => String(c.name).toLowerCase().includes(text) || String(c.realName).toLowerCase().includes(text))
  }
}

module.exports = UsersSearcher
