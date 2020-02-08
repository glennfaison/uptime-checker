const db = require("../db");
const helpers = require("../helpers");
const config = require("../config");

const checkController = {};
/**
 * Required: protocol, url, method, successCodes, timeoutSeconds
 * Optional: none
 * @param {*} req
 * @param {*} res
 * @returns
 */
checkController.post = async (req, res) => {
  // Validate the inputs
  const checkData = helpers.validateCheckData({ ...req.body });
  const { protocol, url, method, successCodes, timeoutSeconds } = checkData;

  // Stop the function if the right inputs are not provided
  if (!protocol || !url || !method || !successCodes || !timeoutSeconds) {
    return res.json({ error: `Missing or invalid required fields` }, 400);
  }
  // Get token from the headers
  const tokenId = req.headers.token || null;
  const token = await db.read("tokens", tokenId).catch(e => res.json({}, 403));
  // Get the related user
  const user = await db.read("users", token.phone).catch(e => res.json({}, 403));
  const userChecks = user.checks || [];
  // Verify that this user has less than the max number of `checks`
  if (userChecks.length >= config.maxChecks) {
    return res.json({ error: `User already has the maximum number of checks (${config.maxChecks})` }, 403);
  }
  // Create a random id for the check
  const checkId = helpers.createRandomString(20);
  // Create a new check
  const check = {
    id: checkId,
    userPhone: user.phone,
    protocol, url, method, successCodes, timeoutSeconds
  };
  await db.create("checks", checkId, check)
    .catch(e => res.json({ error: `Could not create new check` }, 500));
  // Add the checkId to the user object
  userChecks.push(checkId);
  user.checks = userChecks;
  await db.update("users", token.phone, user)
    .catch(e => res.json({ error: `Could not update user with new check` }, 500));
  return res.json(check, 200);
};

/**
 * Fetch a @Check
 * @required id
 * @optional none
 * @param {*} req
 * @param {*} res
 */
checkController.get = async (req, res) => {
  // Check that the id is valid
  const id = req.query.id && req.query.id.trim().length === 20 ? req.query.id.trim() : null;
  if (!id) { return res.json({ error: `Missing required field` }, 400); }
  // Lookup the check
  const check = await db.read("checks", id)
    .catch(e => res.json({ error: `Could not read check data` }, 404));
  const tokenId = req.headers.token || null;
  const authorized = await helpers.verifyToken(tokenId, check.userPhone).catch();
  if (!authorized) { return res.json({ error: `Missing or invalid token` }, 403); }
  return res.json(check, 200);
};

/**
 * Update a @Check object.
 * @required id
 * @optional protocol, url, method, successCodes, timeoutSeconds (one must be sent)
 * @param {*} req
 * @param {*} res
 */
checkController.put = async (req, res) => {
  const checkData = helpers.validateCheckData({ ...req.body });
  const { id, protocol, url, method, successCodes, timeoutSeconds } = checkData;

  // Check that the id field is valid
  if (!id) { return res.json({ error: `Missing required field` }, 400); }
  // Make sure at least one of the other fields is sent
  if (!protocol && !url && !method && !successCodes && !timeoutSeconds) { return res.json({ error: `Missing fields to update` }, 400); }
  const check = await db.read("checks", id)
    .catch(e => res.json({ error: `check ID did not exist` }, 400));
  const tokenId = req.headers.token || null;
  const authorized = await helpers.verifyToken(tokenId, check.userPhone).catch();
  if (!authorized) { return res.json({ error: `Missing or invalid token` }, 403); }
  // Update the check where necessary
  if (protocol) { check.protocol = protocol; }
  if (url) { check.url = url; }
  if (method) { check.method = method; }
  if (successCodes) { check.successCodes = successCodes; }
  if (timeoutSeconds) { check.timeoutSeconds = timeoutSeconds; }
  // Persist the update
  await db.update("checks", id, check)
    .catch(e => res.json({ error: `Failed to update check` }, 500));
  return res.json(check, 200);
};

/**
 * Delete a @Check object.
 * @required id
 * @optional none
 * @param {*} req
 * @param {*} res
 */
checkController.delete = async (req, res) => {
  const id = req.query.id ? req.query.id.toString().trim() : null;
  if (!id) { return res.json({ error: `Missing required field` }, 400); }
  // Lookup the check
  const check = await db.read("checks", id);
  if (!check) { return res.json({ error: "Could not find the specified check" }, 404); }
  // Verify that the sender of this request owns the check
  const tokenId = req.headers.token;
  const authorized = await helpers.verifyToken(tokenId, check.userPhone);
  if (!authorized) { return res.json({ error: `You are not allowed to delete this check`}, 403); }
  await db.delete("checks", id)
    .catch(e => res.json({ error: "Error while deleting the check." }, 500));
  // Lookup the user and remove reference to this check
  const user = await db.read("users", check.userPhone)
    .catch(e => res.json({ error: `Could not find the user of the check` }, 500));
  user.checks = Array.isArray(user.checks) ? user.checks : [];
  user.checks = user.checks.filter(i => i !== id); // Remove the check ID from the user's checks
  await db.update("users", check.userPhone, user)
    .catch(e => res.json({ error: `Could not update user` }, 500));
  return res.json({}, 200);
};

module.exports = checkController;
