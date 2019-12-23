const http = require('http')



class Srvr extends http.Server {
  
  constructor() {
  
    super((req, res) => {
      this.nextFxn(req, res)
    })


    this.currentAddonIndex = 0
    this.addons = []
    
  }

  decorateWith(fxn = this.nextFxn) {
    this.addons.push(fxn)
  }

  async nextFxn(req, res, err = null, next = this.nextFxn) {
    if (this.currentAddonIndex >= this.addons.length) {
      this.currentAddonIndex = 0
      return
    }
    this.addons[this.currentAddonIndex](req, res)
    this.currentAddonIndex++
    this.nextFxn(req, res, err, next)
  }

}



module.exports = Srvr