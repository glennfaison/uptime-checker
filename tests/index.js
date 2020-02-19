const litmus = require("./litmus");
require("./logger");


const tests = {};



tests.init = () => {
  litmus.runTests();
};



tests.init();