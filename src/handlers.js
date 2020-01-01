const db = require('./db')
const helpers = require('./helpers')



const userController = {}

userController.post = async (req, res) => {
  const firstName = req.body.firstName ? req.body.firstName.trim() : undefined
  const lastName = req.body.lastName ? req.body.lastName.trim() : undefined
  const phone = req.body.phone ? req.body.phone.trim() : undefined
  const password = req.body.password ? req.body.password.trim() : undefined
  const tosAgreement = req.body.tosAgreement || false

  if (!firstName || !lastName || !password || !phone || !tosAgreement) {
    return res.json({ error: `Missing required fields` }, 400)
  }
  let read;
  try {
    read = await db.read('users', phone)
  } catch (e) {
    read = false
  }
  if (read) {
    return res.json({ error: 'A user with the given phone number already exists' })
  }
  const hashedPassword = helpers.hash(password)
  if (!hashedPassword) { return res.json({ error: 'Failed to hash password' }, 500) }
  const userObj = { firstName, lastName, hashedPassword, phone, tosAgreement }
  try {
    db.create('users', phone, userObj)
    return res.json({}, 200)
  } catch (e) {
    console.log(e)
    return res.json({ error: 'Could not create user' }, 500)
  }
}

/**
 * Fetch a user's @User object. Only authenticated users can access this path.
 * @required phone
 * @optional none
 * @param {*} req
 * @param {*} res
 */
userController.get = async (req, res) => {
  const phone = req.query.phone ? req.query.phone.toString().trim() : null
  if (!phone) { return res.json({ error: `Missing required field` }, 400) }
  const user = await db.read('users', phone)
  if (!user) { return res.json({}, 404) }
  delete user.hashedPassword
  return res.json(user, 200)
}

/**
 * Update a user's @User object. Only authenticated users can access this path.
 * At least one optional field must be specified
 * @required phone
 * @optional firstName, lastName, password
 * @param {*} req
 * @param {*} res
 */
userController.put = async (req, res) => {
  const phone = req.body.phone ? req.body.phone.toString().trim() : null
  if (!phone) { return res.json({ error: `Missing required field` }, 400) }
  const firstName = req.body.firstName ? req.body.firstName.trim() : undefined
  const lastName = req.body.lastName ? req.body.lastName.trim() : undefined
  const password = req.body.password ? req.body.password.trim() : undefined

  if (!firstName && !lastName && !password) { return res.json({ error: `Found no fields to update` }, 400) }
  const user = await db.read('users', phone)
  if (!user) { return res.json({ error: 'The specified user does not exist' }, 404) }
  
  if (firstName) { user.firstName = firstName }
  if (lastName) { user.lastName = lastName }
  if (password) { user.hashedPassword = helpers.hash(password) }

  // Persist modified user
  try{
    await db.update('users', phone, user)
    return res.json({}, 200)
  } catch (e) {
    console.log(e)
    return res.json({ error: 'Could not update the user', }, 500)
  }
}

/**
 * Delete a user's @User object. Only authenticated users can access this path.
 * @todo Delete any other data files associated with this user
 * @required phone
 * @optional none
 * @param {*} req
 * @param {*} res
 */
userController.delete = async (req, res) => {
  const phone = req.query.phone ? req.query.phone.toString().trim() : null
  if (!phone) { return res.json({ error: `Missing required field` }, 400) }
  const user = await db.read('users', phone)
  if (!user) { return res.json({ error: 'Could not find the specified user' }, 404) }
  try {
    await db.delete('users', phone)
    return res.json({}, 200)
  } catch (e) {
    return res.json({ error: 'Error while deleting the user.', }, 500)
  }
}

const handlers = {
  ping: async (req, res) => {
    res.json({}, 200)
  },
  users: async (req, res) => {
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']
    if (!allowedMethods.includes(req.method.toUpperCase())) { return res.json({}, 405) }
    return userController[req.method.toLowerCase()](req, res)
  },
  notFoundHandler: async (req, res) => {
    res.json('Resource was not found', 404)
  },
}

exports.handlers = handlers;
