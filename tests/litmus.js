const assert = require("assert");


const litmus = {};

litmus.Reset = "\x1b[0m"
litmus.Bright = "\x1b[1m"
litmus.Dim = "\x1b[2m"
litmus.Underscore = "\x1b[4m"
litmus.Blink = "\x1b[5m"
litmus.Reverse = "\x1b[7m"
litmus.Hidden = "\x1b[8m"
 
litmus.FgBlack = "\x1b[30m"
litmus.FgRed = "\x1b[31m"
litmus.FgGreen = "\x1b[32m"
litmus.FgYellow = "\x1b[33m"
litmus.FgBlue = "\x1b[34m"
litmus.FgMagenta = "\x1b[35m"
litmus.FgCyan = "\x1b[36m"
litmus.FgWhite = "\x1b[37m"
 
litmus.BgBlack = "\x1b[40m"
litmus.BgRed = "\x1b[41m"
litmus.BgGreen = "\x1b[42m"
litmus.BgYellow = "\x1b[43m"
litmus.BgBlue = "\x1b[44m"
litmus.BgMagenta = "\x1b[45m"
litmus.BgCyan = "\x1b[46m"
litmus.BgWhite = "\x1b[47m"

litmus.tests = [/* {
  description: "",
  test: () => {},
  passed: false,
  error: null,
} */];



litmus.testThat = (description, fxn) => {
  if (typeof(fxn) !== "function") { return; }
  let descriptionExists = litmus.tests.some(i => i.description === description);
  if (descriptionExists) {
    console.log(`${litmus.FgMagenta}%s${litmus.Reset}`, `Duplicate test description: ${description}`);
    return;
  }
  litmus.tests.push({
    description: description,
    test: fxn,
    passed: false,
    error: null,
  });
};

litmus.runTests = (testIndex = 0) => {
  if (litmus.tests.length === testIndex) {
    litmus.printResults();
    return;
  }

  console.log(`${litmus.FgYellow}%s${litmus.Reset}`, `Running the test: ${litmus.tests[testIndex].description}...`);
  // Run the test, and mark whether or not it succeeds
  let failureHandler = (err) => {
    litmus.tests[testIndex].passed = false;
    console.log(`${litmus.FgRed}%s${litmus.Reset}`, `Test failed: ${litmus.tests[testIndex].description}`);
    console.dir(err, { colors: true });
    litmus.runTests(testIndex + 1);
  };
  let successHandler = () => {
    litmus.tests[testIndex].passed = true;
    console.log(`${litmus.FgGreen}%s${litmus.Reset}`, `Test passed: ${litmus.tests[testIndex].description}`);
    litmus.runTests(testIndex + 1);
  };
  litmus.tests[testIndex].test(failureHandler, successHandler);
};

litmus.printResults = () => {
  let testCount = litmus.tests.length;
  let testsPassed = litmus.tests.filter(i => i.passed).length;
  let percentagePass = Math.round(100 * testsPassed / testCount);
  let colorScheme = `${litmus.FgMagenta}%s${litmus.Reset}`;
  if (percentagePass < 34) {
    colorScheme = `${litmus.FgRed}%s${litmus.Reset}`;
  } else if (percentagePass < 67) {
    colorScheme = `${litmus.FgMagenta}%s${litmus.Reset}`;
  } else if (percentagePass < 100) {
    colorScheme = `${litmus.FgYellow}%s${litmus.Reset}`;
  } else if (percentagePass == 100) {
    colorScheme = `${litmus.FgGreen}%s${litmus.Reset}`;
  }
  console.log();
  console.log(colorScheme, `${testsPassed} tests passed out of ${testCount}!`);
};



module.exports = litmus;