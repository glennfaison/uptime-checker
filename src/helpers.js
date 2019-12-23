const crypto = require('crypto')

const config = require('../config')



const helpers = {}

helpers.hash = (payload) => {
  if (!payload) { return false }
  const hash = crypto.createHmac('sha256', config.hashingSecret).update(payload).digest('hex')
  return hash
}



module.exports = helpers