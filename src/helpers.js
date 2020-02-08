const crypto = require("crypto");

const db = require("./db");
const config = require("./config");

const helpers = {};

helpers.hash = payload => {
  if (!payload) { return false; }
  const hash = crypto
    .createHmac("sha256", config.hashingSecret)
    .update(payload)
    .digest("hex");
  return hash;
};

helpers.createRandomString = len => {
  if (typeof len !== typeof 1 || len <= 0) { return false; }
  const charList = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += charList.charAt(Math.floor(Math.random() * charList.length));
  }
  return result;
};

helpers.verifyToken = async (tokenId, phone) => {
  let token = await db.read("tokens", tokenId);
  if (!token) { return false; }
  // Check that the token belongs to the user, and is not expired
  if (token.phone !== phone || token.expires < Date.now()) { return false; }
  return true;
};

// Transform an object to valid check if possible
helpers.validateCheckData = (check) => {
  if (!check) { return {}; }
  const acceptedMethods = ["GET", "POST", "PUT", "DELETE"];
  const protocolRegExp = /^[^.]*:\/\//;

  check = typeof (check) === "object" && !!check ? check : {};
  const { id, userPhone, protocol, url, method, successCodes, timeoutSeconds, state, lastChecked, ...props } = check;

  id = typeof (id) === "string" && id.length === 20 ? id : "";

  userPhone = typeof (userPhone) === "string" ? userPhone.trim() : "";

  protocol = typeof (protocol) === "string" ? protocol.trim().toLowerCase() : "";
  protocol = ["http", "https"].includes(protocol) ? protocol : "";

  url = typeof (url) === "string" ? url.trim() : "";
  url = url.replace(protocolRegExp, "");
  url = !url.includes(" ") ? url : "";

  method = typeof (method) === "string" ? method.trim().toUpperCase() : "";
  method = acceptedMethods.includes(method) ? method : "";

  successCodes = Array.isArray(successCodes) && successCodes.length > 0 ? successCodes : false;

  timeoutSeconds = typeof (timeoutSeconds) === "number" ? Math.floor(timeoutSeconds) : 0;
  timeoutSeconds = timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : false;

  // Set the keys that may not be set for checks this worker hasn't seen yet
  state = typeof (state) === "string" ? state.trim().toLowerCase() : "";
  state = ["up", "down"].includes(state) ? state : "down";

  lastChecked = typeof (lastChecked) === "number" && lastChecked > 0 ? lastChecked : false;

  return { id, userPhone, protocol, url, method, successCodes, timeoutSeconds, state, lastChecked, ...props };
};

helpers.validateUserData = (user) => {
  if (!user) { return {}; }
  const { id, firstName, lastName, phone, password, tosAgreement, checks, ...props } = user;

  id = typeof (id) === "string" && id ? id.trim() : undefined;
  firstName = typeof (firstName) === "string" && firstName ? firstName.trim() : undefined;
  lastName = typeof (lastName) === "string" && lastName ? lastName.trim() : undefined;
  phone = typeof (phone) === "string" && phone ? phone.trim() : undefined;
  password = typeof (password) === "string" && password ? password.trim() : undefined;
  tosAgreement = typeof (tosAgreement) === "boolean" ? tosAgreement : false;
  checks = Array.isArray(checks) ? checks : [];

  return { id, firstName, lastName, phone, password, tosAgreement, checks, ...props };
};



module.exports = helpers;
