const userController = require('./users')
const tokenController = require('./tokens')



const handlers = {
  ping: (req, res) => {
    res.json({}, 200)
  },
  users: (req, res) => {
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']
    if (!allowedMethods.includes(req.method.toUpperCase())) { return res.json({}, 405) }
    return userController[req.method.toLowerCase()](req, res)
  },
  tokens: (req, res) => {
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']
    if (!allowedMethods.includes(req.method.toUpperCase())) { return res.json({}, 405) }
    return tokenController[req.method.toLowerCase()](req, res)
  },
  notFoundHandler: async (req, res) => {
    res.json('Resource was not found', 404)
  },
}

exports.handlers = handlers;
