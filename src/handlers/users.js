const db = require("../db");
const helpers = require("../helpers");
const tokenController = require("./tokens");

const userController = {};

userController.post = async (req, res) => {
  const userData = helpers.validateUserData({ ...req.body });
  const { firstName, lastName, phone, password, tosAgreement } = userData;

  if (!firstName || !lastName || !password || !phone || !tosAgreement) {
    return res.setStatus(400).json({ error: `Missing required fields` });
  }
  let read = await db.read("users", phone).catch(e => read = false);
  if (read) {
    return res.setStatus(400).json({ error: "A user with the given phone number already exists" });
  }
  const hashedPassword = helpers.hash(password);
  if (!hashedPassword) {
    return res.setStatus(500).json({ error: "Failed to hash password" });
  }
  const userObj = { firstName, lastName, hashedPassword, phone, tosAgreement };
  db.create("users", phone, userObj)
    .catch(e => res.setStatus(500).json({ error: "Could not create user" }));
  return res.setStatus(200).json();
};

/**
 * Fetch a user's @User object. Only authenticated users can access this path.
 * @required phone
 * @optional none
 * @param {*} req
 * @param {*} res
 */
userController.get = async (req, res) => {
  const phone = req.query.phone ? req.query.phone.toString().trim() : null;
  if (!phone) {
    return res.setStatus(400).json({ error: `Missing required field` });
  }
  // Get the token from the headers
  const token = req.headers.token;
  // Verify that the token belongs to this user
  const tokenIsValid = await helpers.verifyToken(token, phone);
  if (!tokenIsValid) {
    return res.setStatus(403).json({ error: `Missing required token in header, or token is invalid` });
  }
  const user = await db.read("users", phone);
  if (!user) {
    return res.setStatus(404).json();
  }
  delete user.hashedPassword;
  return res.setStatus(200).json(user);
};

/**
 * Update a user's @User object. Only authenticated users can access this path.
 * At least one optional field must be specified
 * @required phone
 * @optional firstName, lastName, password
 * @param {*} req
 * @param {*} res
 */
userController.put = async (req, res) => {
  const userData = helpers.validateUserData({ ...req.body });
  const { firstName, lastName, phone, password } = userData;
  
  if (!phone) {
    return res.setStatus(400).json({ error: `Missing required field` });
  }
  if (!firstName && !lastName && !password) {
    return res.setStatus(400).json({ error: `Found no fields to update` });
  }
  // Get the token from the headers
  const token = req.headers.token;
  // Verify that the token belongs to this user
  const tokenIsValid = await helpers.verifyToken(token, phone);
  if (!tokenIsValid) {
    return res.setStatus(403).json({ error: `Missing required token in header, or token is invalid` });
  }
  const user = await db.read("users", phone);
  if (!user) {
    return res.setStatus(404).json({ error: "The specified user does not exist" });
  }

  if (firstName) {
    user.firstName = firstName;
  }
  if (lastName) { user.lastName = lastName; }
  if (password) { user.hashedPassword = helpers.hash(password); }

  // Persist modified user
  await db.update("users", phone, user)
    .catch(e => res.setStatus(500).json({ error: "Could not update the user" }));
  return res.setStatus(200).json();
};

/**
 * Delete a user's @User object. Only authenticated users can access this path.
 * Delete any other data files associated with this user
 * @required phone
 * @optional none
 * @param {*} req
 * @param {*} res
 */
userController.delete = async (req, res) => {
  const phone = req.query.phone ? req.query.phone.toString().trim() : null;
  if (!phone) {
    return res.setStatus(400).json({ error: `Missing required field` });
  }
  // Get the token from the headers
  const token = req.headers.token;
  // Verify that the token belongs to this user
  const tokenIsValid = await helpers.verifyToken(token, phone);
  if (!tokenIsValid) {
    return res.setStatus(403).json({ error: `Missing required token in header, or token is invalid` });
  }
  const user = await db.read("users", phone);
  if (!user) {
    return res.setStatus(404).json({ error: "Could not find the specified user" });
  }
  await db.delete("users", phone)
    .catch(e => res.setStatus(500).json({ error: "Error while deleting the user." }));
  // Delete this user's associations
  // Delete the user's checks
  const userChecks = Array.isArray(user.checks) ? user.checks : [];
  const promises = userChecks.map(checkId => db.delete("checks", checkId));
  await Promise.all(promises)
    .catch(e => res.setStatus(500).json({ error: `All this user's checks may not have been deleted successfully` }));
  return res.setStatus(200).json();
};

module.exports = userController;
