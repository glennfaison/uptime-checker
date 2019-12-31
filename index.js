const https = require('https')
const url = require('url')
const fs = require('fs')

const { handlers } = require("./src/handlers")
const env = require('./src/config')
const Srvr = require('./lib/srvr')
const requestbody = require('./lib/requestbody')



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

const httpsServer = https.createServer(httpsOptions, (req, res) => {
  unifiedServer(req, res)
})

httpsServer.listen(env.httpsPort, () => {
  console.log(`Application is listening on port ${env.httpsPort}, in ${env.envName} mode`)
})

const unifiedServer = (req, res) => {

  req.on('end', async () => {

    res.json = (data, status = 200) => {
      res.setHeader('content-type', 'application/json')
      res.writeHead(status)
      return res.end(JSON.stringify(data))
    }

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

const router = {
  'ping': handlers.ping,
  'users': handlers.users,
}