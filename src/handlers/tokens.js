const db = require("../db");
const helpers = require("../helpers");

const tokenController = {};
/**
 * Required: phone, password
 * @param {*} req
 * @param {*} res
 * @returns
 */
tokenController.post = async (req, res) => {
  const phone = req.body.phone ? req.body.phone.trim() : undefined;
  const password = req.body.password ? req.body.password.trim() : undefined;

  if (!phone || !password) {
    return res.setStatus(400).json({ error: `Missing required fields` });
  }
  let user = await db.read("users", phone).catch(e => user = null);
  if (!user) {
    return res.setStatus(400).json({ error: "Could not find the specified user" });
  }
  // check that password hash matches saved hashedPassword
  const hashedPassword = helpers.hash(password);
  if (hashedPassword !== user.hashedPassword) {
    return res.setStatus(400).json({ error: "Specified password does not match stored password" });
  }
  // Create a new token and set a 1-hour expiration date
  const expires = Date.now() + 60 * 60 * 1000;
  const tokenId = helpers.createRandomString(20);
  const tokenObj = { phone, expires, tokenId };
  let created = await db.create("tokens", tokenId, tokenObj).catch(e => created = false);
  if (!created) {
    return res.setStatus(500).json({ error: "Could not create new token" });
  }
  return res.setStatus(200).json(tokenObj);
};

/**
 * Fetch a token
 * @required id
 * @optional none
 * @param {*} req
 * @param {*} res
 */
tokenController.get = async (req, res) => {
  const id = req.query.id ? req.query.id.toString().trim() : null;
  if (!id) {
    return res.setStatus(400).json({ error: `Missing required field` });
  }
  const token = await db.read("tokens", id);
  if (!token) { return res.setStatus(404).json(); }
  delete token.hashedPassword;
  return res.setStatus(200).json(token);
};

/**
 * Update a @Token object.
 * @required id, extend
 * @optional none
 * @param {*} req
 * @param {*} res
 */
tokenController.put = async (req, res) => {
  const id = req.query.id ? req.query.id.toString().trim() : null;
  if (!id) {
    return res.setStatus(400).json({ error: `Missing required field` });
  }
  let extend = false;
  try {
    extend = JSON.parse(req.query.extend);
  } catch (e) { extend = false; }

  if (!id || !extend) {
    return res.setStatus(400).json({ error: `Missing required fields` });
  }
  const token = await db.read("tokens", id);
  if (!token) {
    return res.setStatus(404).json({ error: "The specified token does not exist" });
  }
  // Check that the token isn't expired
  if (token.expires < Date.now()) {
    return res.setStatus(400).json({ error: `The token has already expired, and cannot be extended` });
  }
  // If token isn't expired, extend it by one hour from now
  token.expires = Date.now() + 60 * 60 * 1000;
  await db.update("tokens", id, token)
    .catch(e => res.setStatus(500).json({ error: `Could not update the token's expiration date` }));
  return res.setStatus(200).json();
};

/**
 * Delete a @Token object.
 * @required id
 * @optional none
 * @param {*} req
 * @param {*} res
 */
tokenController.delete = async (req, res) => {
  const id = req.query.id ? req.query.id.toString().trim() : null;
  if (!id) {
    return res.setStatus(400).json({ error: `Missing required field` });
  }
  const token = await db.read("tokens", id);
  if (!token) {
    return res.setStatus(404).json({ error: "Could not find the specified token" });
  }
  await db.delete("tokens", id)
    .catch(e => res.setStatus(500).json({ error: "Error while deleting the token." }));
  return res.setStatus(200).json();
};

module.exports = tokenController;
