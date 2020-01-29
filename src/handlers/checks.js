const db = require('../db')
const helpers = require('../helpers')



const checkController = {}
/**
 * Required: protocol, url, method, successCodes, timeoutSeconds
 * Optional: none
 * @param {*} req
 * @param {*} res
 * @returns
 */
checkController.post = async (req, res) => {
  const protocol = req.body.protocol && ['https', 'http'].includes(req.body.protocol.trim().toLowerCase()) ? req.body.protocol.trim() : undefined
  const url = req.body.url && req.body.url.trim().length > 0 ? req.body.url.trim() : undefined
  const method = req.body.method && ['get', 'post', 'put', 'delete'].includes(req.body.method.trim().toLowerCase()) ? req.body.method.trim() : undefined
  const successCodes = Array.isArray(req.body.successCodes) && req.body.successCodes.length > 0 ? req.body.successCodes : undefined

  if (!phone || !password) {
    return res.json({ error: `Missing required fields` }, 400)
  }
  let user;
  try {
    user = await db.read('users', phone)
  } catch (e) { user = null }
  if (!user) {
    return res.json({ error: 'Could not find the specified user' }, 400)
  }
  // check that password hash matches saved hashedPassword
  const hashedPassword = helpers.hash(password)
  if (hashedPassword !== user.hashedPassword) {
    return res.json({ error: 'Specified password does not match stored password' }, 400)
  }
  // Create a new token and set a 1-hour expiration date
  const expires = Date.now() + 60 * 60 * 1000
  const tokenId = helpers.createRandomString(20)
  const tokenObj = {
    phone, expires, tokenId,
  }
  let created = false
  try {
    created = await db.create('tokens', tokenId, tokenObj)
  } catch (e) { created = false }
  if (!created) { return res.json({ error: 'Could not create new token' }, 500) }
  return res.json(tokenObj, 200)
}

/**
 * Fetch a token
 * @required id
 * @optional none
 * @param {*} req
 * @param {*} res
 */
checkController.get = async (req, res) => {
  const id = req.query.id ? req.query.id.toString().trim() : null
  if (!id) { return res.json({ error: `Missing required field` }, 400) }
  const token = await db.read('tokens', id)
  if (!token) { return res.json({}, 404) }
  delete token.hashedPassword
  return res.json(token, 200)
}

/**
 * Update a @Token object.
 * @required id, extend
 * @optional none
 * @param {*} req
 * @param {*} res
 */
checkController.put = async (req, res) => {
  const id = req.query.id ? req.query.id.toString().trim() : null
  if (!id) { return res.json({ error: `Missing required field` }, 400) }
  let extend = false
  try {
    extend = JSON.parse(req.query.extend)
  } catch (e) { extend = false }

  if (!id || !extend) { return res.json({ error: `Missing required fields` }, 400) }
  const token = await db.read('tokens', id)
  if (!token) { return res.json({ error: 'The specified token does not exist' }, 404) }
  // Check that the token isn't expired
  if (token.expires < Date.now()) {
    return res.json({ error: `The token has already expired, and cannot be extended` }, 400)
  }
  // If token isn't expired, extend it by one hour from now
  token.expires = Date.now() + 60 * 60 * 1000
  try {
    await db.update('tokens', id, token)
  } catch (e) { return res.json({ error: `Could not update the token's expiration date` }, 500) }
  return res.json({}, 200)
}

/**
 * Delete a @Token object.
 * @required id
 * @optional none
 * @param {*} req
 * @param {*} res
 */
checkController.delete = async (req, res) => {
  const id = req.query.id ? req.query.id.toString().trim() : null
  if (!id) { return res.json({ error: `Missing required field` }, 400) }
  const token = await db.read('tokens', id)
  if (!token) { return res.json({ error: 'Could not find the specified token' }, 404) }
  try {
    await db.delete('tokens', id)
    return res.json({}, 200)
  } catch (e) {
    return res.json({ error: 'Error while deleting the token.', }, 500)
  }
}

checkController.verifyToken = async (tokenId, phone) => {
  let token = await db.read('tokens', tokenId)
  if (!token) { return false }
  // Check that the token belongs to the user, and is not expired
  if (token.phone !== phone || token.expires < Date.now()) { return false }
  return true
}

module.exports = checkController;
