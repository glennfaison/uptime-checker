const assert = require("assert");

const litmus = require("../../lib/litmus");
const paxios = require("../../lib/paxios");



litmus.testThat(
  "`/api/v1/users` should respond to GET with a status code of 400",
  async (failureHandler, successHandler) => {
    try {
      let res = await paxios.get("http://localhost:3000/api/v1/users");
      assert.equal(res.statusCode, 400);
    } catch (e) {
      failureHandler(e);
      return;
    }
    successHandler();
  });

litmus.testThat(
  "a random pathname should respond to GET with a status code of 404",
  async (failureHandler, successHandler) => {
    try {
      let res = await paxios.get("http://localhost:3000/this/does/not/exist");
      assert.equal(res.statusCode, 404);
    } catch (e) {
      failureHandler(e);
      return;
    }
    successHandler();
  });