const http = require('http')



function Srvr(protocol = http) {
  let currentDecoratorIndex = 0
  const decorators = []

  const next = (req, res, err) => {
    if (currentDecoratorIndex >= decorators.length) {
      currentDecoratorIndex = 0
      return
    }
    decorators[currentDecoratorIndex](req, res, err)
    currentDecoratorIndex++
    next(req, res, err)
  }

  const server = protocol.createServer((req, res, err) => next(req, res, err))

  server.decorateWith = (fxn = () => { }) => {
    decorators.push(fxn)
  }

  return server
}



module.exports = Srvr