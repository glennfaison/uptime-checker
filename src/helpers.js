const crypto = require('crypto')
const db = require('./db')
const config = require('./config')



const helpers = {}

helpers.hash = (payload) => {
  if (!payload) { return false }
  const hash = crypto.createHmac('sha256', config.hashingSecret).update(payload).digest('hex')
  return hash
}

helpers.createRandomString = len => {
  if (typeof(len) !== typeof(1) || len <= 0) { return false }
  const charList = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < len; i++) {
    result += charList.charAt(Math.floor(Math.random() * charList.length))
  }
  return result
}

helpers.verifyToken = async (tokenId, phone) => {
  let token = await db.read('tokens', tokenId)
  if (!token) { return false }
  // Check that the token belongs to the user, and is not expired
  if (token.phone !== phone || token.expires < Date.now()) { return false }
  return true
}



module.exports = helpers