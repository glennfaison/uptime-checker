const crypto = require('crypto')

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



module.exports = helpers