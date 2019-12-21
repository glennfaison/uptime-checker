const http = require('http')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder;

const env = require('./config')

const server = http.createServer((req, res) => {

  const decoder = new StringDecoder('utf-8')
  let buffer = ''

  req.on('data', async (data) => {

    buffer += decoder.write(data)

  })

  req.on('end', async () => {

    buffer += decoder.end()

    const parsedUrl = url.parse(req.url, true)
    const path = parsedUrl.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')
    req.method = req.method.toUpperCase()
    req.query = parsedUrl.query ? parsedUrl.query : {}
    req.headers = req.headers ? req.headers : {}
    req.body = buffer ? buffer : {}

    res.json = (data) => {
      res.setHeader('content-type', 'application/json')
      return res.end(JSON.stringify(data))
    }

    console.log(`Path: ${trimmedPath} with method: ${req.method}`)
    console.log(`Query params: ${JSON.stringify(req.query)}`)
    console.log(`Headers: ${JSON.stringify(req.headers)}`)
    console.log(`Payload: ${JSON.stringify(req.body)}`)

    if (!router[trimmedPath]) {
      handlers.notFoundHandler(req, res)
      return
    }
    router[trimmedPath](req, res)

  })

})

server.listen(env.port, () => {
  console.log(`Application is listening on port ${env.port}, in ${env.envName} mode`)
})

const handlers = {
  sampleHandler: async (req, res) => {
    res.json({ payload: 'Here\'s a sample response' })
  },
  notFoundHandler: async (req, res) => {
    res.json('Resource was not found')
  },
}

const router = {
  'sample': handlers.sampleHandler,
}