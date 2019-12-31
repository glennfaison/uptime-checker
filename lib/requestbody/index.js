const { StringDecoder } = require('string_decoder')
const url = require('url')

const requestbody = (req, res, err) => {
  const decoder = new StringDecoder('utf-8')
  let requeststring = ''
  
  req.on('data', data => {
    requeststring += decoder.write(data)
  })

  req.on('end', () => {
    requeststring += decoder.end()
  })

  const parsedUrl = url.parse(req.url, true)
  const path = parsedUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')

  req.method = req.method.toUpperCase()
  req.query = parsedUrl.query ? parsedUrl.query : {}
  req.headers = req.headers ? req.headers : {}
  req.body = requeststring ? JSON.parse(requeststring) : {}
  req.trimmedPath = trimmedPath

}

module.exports = requestbody