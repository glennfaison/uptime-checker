const http = require('http')
const { StringDecoder } = require('string_decoder')
const url = require('url')



function getObj(route = '') {
  const paramNameRegExp = `\:([^/]+)`
  const paramValueRegExp = `([^\/]+)`
  // Replace url param names with regex for param values
  // Use this value as key for the route, and to make a regexp to match urls
  let str = `${route}\$`
  const routeExp = str.replace(new RegExp(`${paramNameRegExp}`, 'g'), paramValueRegExp)
  const paramNameGetterExp = str.replace(new RegExp(`${paramNameRegExp}`, 'g'), paramNameRegExp)
  return { route, routeExp, paramNameGetterExp }
}

function Srvr(protocol = http, options = {}) {
  const decorators = []
  const router = {}

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

      // Default/fallback request handler
      let handler = (req, res) => {
        res.setHeader('content-type', 'application/json')
        res.writeHead(404)
        return res.end(`Resource not found`)
      }
      for (let routeExp in router) {
        // If a `trimmedPath` matches a `route`, use the corresponding handler
        if (new RegExp(routeExp).test(trimmedPath)) {
          const obj = router[routeExp]
          const paramNames = obj.route.match(obj.paramNameGetterExp).slice(1)
          const paramValues = trimmedPath.match(obj.routeExp).slice(1)
          /* Add url params to req object */
          req.params = {}
          paramNames.forEach((param, index) => req.params[param] = paramValues[index])

          handler = obj[req.method] ? obj[req.method.toLowerCase()].handler : handler
          break
        }
      }
      handler(req, res)
    })
  }

  const server = protocol.createServer(options, (req, res, err) => {
    fetchRequestInfo(req, res, err)
    next(req, res, err, decorators)
  })

  server.decorateWith = (fxn = () => { }) => {
    decorators.push(fxn)
  }

  server.addRoute = (route = '', method = 'get', handler = (req, res) => { }) => {
    route = route.replace(/^\/+|\/+$/g, '')
    method = method.toLowerCase()
    // Remove query string
    route = route.split('?')[0]
    const { routeExp, paramNameGetterExp } = getObj(route)
    // Save to router, eliminating any older handler for the same url
    router[routeExp] = router[routeExp] || {}
    router[routeExp].route = route
    router[routeExp].routeExp = routeExp
    router[routeExp].paramNameGetterExp = paramNameGetterExp
    router[routeExp][method] = router[routeExp][method] || {}
    router[routeExp][method].handler = handler
  }



  return server
}



module.exports = Srvr