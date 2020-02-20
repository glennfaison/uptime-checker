const litmus = require("../lib/litmus");

require("./logger");
require("./api-tests");


const tests = {};



tests.init = () => {
  litmus.runTests();
};



tests.init();