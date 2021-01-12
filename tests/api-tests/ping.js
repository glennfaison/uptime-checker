const assert = require("assert");

const litmus = require("../../lib/litmus");
const paxios = require("../../lib/paxios");



litmus.testThat(
  "`/ping/:id` should respond to GET with a status code of 200",
  async (failureHandler, successHandler) => {
    try {
      let res = await paxios.get("http://localhost:3000/ping/2?sender=paxios", {name:"glenn"}, {text:"lorem ipsum"});
      assert.strictEqual(res.statusCode, 200);
    } catch (e) {
      failureHandler(e);
      return;
    }
    successHandler();
  });