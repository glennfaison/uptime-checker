const db = require('./db')
const helpers = require('./helpers')



const userController = {}

userController.get = async (req, res) => {
  const firstName = req.body.firstName.trim()
  const lastName = req.body.lastName.trim()
  const phone = req.body.phone.trim()
  const password = req.body.password.trim()
  const tosAgreement = req.body.tosAgreement || false

  if (!firstName || !lastName || !password || !phone || !tosAgreement) {
    return res.json({ error: 'Missing required fields' }, 400)
  }
  const read = await db.read('users', phone)
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

const handlers = {
  ping: async (req, res) => {
    res.json({}, 200)
  },
  users: async (req, res) => {
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']
    if (!allowedMethods.includes(req.method.toUpperCase)) { return res.json({}, 405) }
    return userController[req.method.toLowerCase()](req, res)
  },
  notFoundHandler: async (req, res) => {
    res.json('Resource was not found', 404)
  },
}

exports.handlers = handlers;
