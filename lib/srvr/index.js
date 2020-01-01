const http = require('http')
const { StringDecoder } = require('string_decoder')
const url = require('url')



function Srvr(protocol = http, options = {}) {
  const decorators = []

  const next = (req, res, err, decorators = []) => {
    if (!decorators.length) { return }
    const [fxn, ...nextDecorators] = decorators
    fxn(req, res, err)
    next(req, res, err, nextDecorators)
  }

  const fetchRequestInfo = (req, res, err) => {
    const decoder = new StringDecoder('utf-8')
    let requeststring = ''

    req.on('data', data => {
      requeststring += decoder.write(data)
    })

    req.on('end', () => {
      requeststring += decoder.end()

      const parsedUrl = url.parse(req.url, true)
      const path = parsedUrl.pathname
      const trimmedPath = path.replace(/^\/+|\/+$/g, '')

      req.method = req.method.toUpperCase()
      req.query = parsedUrl.query ? parsedUrl.query : {}
      req.headers = req.headers ? req.headers : {}
      req.body = requeststring ? requeststring : ''
      req.trimmedPath = trimmedPath
    })
  }

  const server = protocol.createServer(options, (req, res, err) => {
    fetchRequestInfo(req, res, err)
    next(req, res, err, decorators)
  })

  server.decorateWith = (fxn = () => { }) => {
    decorators.push(fxn)
  }

  return server
}



module.exports = Srvr