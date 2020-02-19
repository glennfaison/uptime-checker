const litmus = require("../lib/litmus");
require("./logger");


const tests = {};



tests.init = () => {
  litmus.runTests();
};



tests.init();