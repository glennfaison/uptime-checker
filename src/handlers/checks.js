const _url = require("url");
const _dns = require("dns");
const _util = require("util");

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
    return res.setStatus(400).json({ error: `Missing or invalid required fields` });
  }
  // Get token from the headers
  const tokenId = req.headers.token || null;
  const token = await db.read("tokens", tokenId).catch(e => res.setStatus(403).json());
  // Get the related user
  const user = await db.read("users", token.phone).catch(e => res.setStatus(403).json());
  const userChecks = user.checks || [];
  // Verify that this user has less than the max number of `checks`
  if (userChecks.length >= config.maxChecks) {
    return res.setStatus(403).json({ error: `User already has the maximum number of checks (${config.maxChecks})` });
  }
  // Verify that the provided url exists
  const { hostname } = _url.parse(`${protocol}://${url}`, true);
  const records = await _util.promisify(_dns.resolve)(hostname).catch(e => {});
  if (!records || !records.length) {
    return res.setStatus(400).json({
      error: `The hostname of the URL provided(${url}) did not resolve to any DNS entries`,
    });
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
    .catch(e => res.setStatus(500).json({ error: `Could not create new check` }));
  // Add the checkId to the user object
  userChecks.push(checkId);
  user.checks = userChecks;
  await db.update("users", token.phone, user)
    .catch(e => res.setStatus(500).json({ error: `Could not update user with new check` }));
  return res.setStatus(200).json(check);
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
  if (!id) { return res.setStatus(400).json({ error: `Missing required field` }); }
  // Lookup the check
  const check = await db.read("checks", id)
    .catch(e => res.setStatus(404).json({ error: `Could not read check data` }));
  const tokenId = req.headers.token || null;
  const authorized = await helpers.verifyToken(tokenId, check.userPhone).catch(e => {});
  if (!authorized) { return res.setStatus(403).json({ error: `Missing or invalid token` }); }
  return res.setStatus(200).json(check);
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
  if (!id) { return res.setStatus(400).json({ error: `Missing required field` }); }
  // Make sure at least one of the other fields is sent
  if (!protocol && !url && !method && !successCodes && !timeoutSeconds) {
    return res.setStatus(400).json({ error: `Missing fields to update` });
  }
  const check = await db.read("checks", id)
    .catch(e => res.setStatus(400).json({ error: `check ID did not exist` }));
  const tokenId = req.headers.token || null;
  const authorized = await helpers.verifyToken(tokenId, check.userPhone).catch(e => {});
  if (!authorized) { return res.setStatus(403).json({ error: `Missing or invalid token` }); }
  // Update the check where necessary
  if (protocol) { check.protocol = protocol; }
  if (url) { check.url = url; }
  if (method) { check.method = method; }
  if (successCodes) { check.successCodes = successCodes; }
  if (timeoutSeconds) { check.timeoutSeconds = timeoutSeconds; }
  // Persist the update
  await db.update("checks", id, check)
    .catch(e => res.setStatus(500).json({ error: `Failed to update check` }));
  return res.setStatus(200).json(check);
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
  if (!id) { return res.setStatus(400).json({ error: `Missing required field` }); }
  // Lookup the check
  const check = await db.read("checks", id);
  if (!check) { return res.setStatus(404).json({ error: "Could not find the specified check" }); }
  // Verify that the sender of this request owns the check
  const tokenId = req.headers.token;
  const authorized = await helpers.verifyToken(tokenId, check.userPhone);
  if (!authorized) { return res.setStatus(403).json({ error: `You are not allowed to delete this check`}); }
  await db.delete("checks", id)
    .catch(e => res.setStatus(500).json({ error: "Error while deleting the check." }));
  // Lookup the user and remove reference to this check
  const user = await db.read("users", check.userPhone)
    .catch(e => res.setStatus(500).json({ error: `Could not find the user of the check` }));
  user.checks = Array.isArray(user.checks) ? user.checks : [];
  user.checks = user.checks.filter(i => i !== id); // Remove the check ID from the user's checks
  await db.update("users", check.userPhone, user)
    .catch(e => res.setStatus(500).json({ error: `Could not update user` }));
  return res.setStatus(200).json();
};

module.exports = checkController;
