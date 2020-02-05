const https = require('https')
const url = require('url')
const fs = require('fs')

const { handlers } = require("./src/handlers")
const env = require('./src/config')
const Srvr = require('./lib/srvr')
const requestbody = require('./lib/requestbody')



// Create an HTTP server
const httpServer = Srvr()
httpServer.decorateWith((req, res) => { requestbody(req, res) })
httpServer.decorateWith((req, res) => { unifiedServer(req, res) })

httpServer.listen(env.httpPort, () => {
  console.log(`Application is listening on port ${env.httpPort}, in ${env.envName} mode`)
})

const httpsOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
}

// Create an HTTPS server
const httpsServer = https.createServer(httpsOptions, (req, res) => {
  unifiedServer(req, res)
})

httpsServer.listen(env.httpsPort, () => {
  console.log(`Application is listening on port ${env.httpsPort}, in ${env.envName} mode`)
})

const unifiedServer = (req, res) => {

  req.on('end', async () => {

    // Function to end transmission on this stream and send response as JSON, with a status
    res.json = (data, status = 200) => {
      res.setHeader('content-type', 'application/json')
      res.writeHead(status)
      return res.end(JSON.stringify(data))
    }

    // Send this request to the appropriate handler method
    const parsedUrl = url.parse(req.url, true)
    const path = parsedUrl.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')

    if (!router[trimmedPath]) {
      handlers.notFoundHandler(req, res)
      return
    }
    router[trimmedPath](req, res)

  })

}

// Rudimentary routing for the application
const router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks,
}

httpServer.addRoute('/floor/:floorNumber/rooms/:roomNumber', 'put', (req, res) => console.log(req.params))