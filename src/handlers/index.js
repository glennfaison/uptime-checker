const userController = require('./users')
const tokenController = require('./tokens')
const checkController = require('./checks')



const handlers = {
  users: userController,
  tokens: tokenController,
  checks: checkController,
}

exports.handlers = handlers
