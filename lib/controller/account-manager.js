const fs = require('fs')
const path = require('path')

class AccountsManager {
  constructor() {
    this.servicesPath = path.resolve(__dirname, '..', 'services')
    this.accounts = []
  }

  serialize() {
    return this.accounts.map((account) => {
      const config = account.serialize()
      config.service = account.service.id
      return config
    })
  }

  deserialize(config) {
    for (const c of config) {
      const service = require(path.join(this.servicesPath, c.service))
      service.Account.deserialize(service, c)
    }
  }

  getServices() {
    const services = fs.readdirSync(this.servicesPath)
    return services.map((s) => require(path.join(this.servicesPath, s)))
  }

  addAccount(account) {
    this.accounts.push(account)
  }

  removeAccount(account) {
    account.onRemove.dispatch(account)
    account.disconnect()
    this.accounts.splice(this.accounts.indexOf(account), 1)
  }

  findAccountById(id) {
    return this.accounts.find((a) => a.id == id)
  }
}

module.exports = new AccountsManager