const userController = require("./users");
const tokenController = require("./tokens");
const checkController = require("./checks");
const uiController = require("./ui");

const handlers = {
  users: userController,
  tokens: tokenController,
  checks: checkController,
  ui: uiController,
};

exports.handlers = handlers;
