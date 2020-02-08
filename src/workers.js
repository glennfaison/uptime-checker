const url = require("url");
const http = require("http");
const https = require("https");

const twilight = require("../lib/twilight");
const db = require("./db");
const helpers = require("./helpers");



const workers = {};
const checkInterval = 5000;

// Transform an object to valid check if possible
workers.validateCheckData = (check) => {
  const { id, userPhone, protocol, url, method, successCodes, timeoutSeconds, state, lastChecked } = helpers.validateCheckData(check);

  // If all the checks pass, pass the data to the next step
  if (id && userPhone && protocol && url && method && successCodes && timeoutSeconds) {
    return { id, userPhone, protocol, url, method, successCodes, timeoutSeconds, state, lastChecked };
  } else {
    console.log(`Error: One of the checks is not properly formatted. Skipping it.`);
    return false;
  }
};

workers.alertUserToStatusChange = (check) => {
  const msg = `Alert: Your check for:

  ${check.method.toUpperCase()} ${check.protocol}://${check.url}

  is currently ${check.state}!`;
  twilight.sendSms(check.userPhone, msg, err => {
    if (!err) { console.log(`Success! User was alerted to a change in check status via SMS.`); }
    else { console.log(`Error: Could not send SMS to user with a change in check status.`); }
  });
};

/*
 * Process the checkOutcome, and update the check data as needed, and trigger an
 * alert if needed. Special logic for accomodating a check that has never been tested
 * before(we don't want to alert the user in this case.)
 */
workers.processCheckOutcome = async (check, checkOutcome) => {
  // Decide if the check is considered 'up' or 'down' in its current state
  const state = !checkOutcome.error && checkOutcome.responseCode && check.successCodes.includes(checkOutcome.responseCode) ? "up" : "down";
  // Decide if an alert is warranted
  const shouldAlert = check.lastChecked && check.state != state ? true : false;
  // Update the check data
  check.state = state;
  check.lastChecked = Date.now();

  // Save the check
  await db.update("checks", check.id, check)
    .catch(e => console.log(`Error updating check with id: ${check.id}`));
  // Send the new check data to the next phase
  if (!shouldAlert) {
    console.log(`Check state hasn't changed; no alert warranted`);
    return;
  }
  // Alert user
  workers.alertUserToStatusChange(check);
};

workers.runOneCheck = (check) => {
  // Prepare the initial check outcome
  const checkOutcome = {
    error: false,
    responseCode: false,
  };
  // Mark that the outcome hasn't been sent yet
  let outcomeSent = false;
  // Parse the hostname and path of the check
  const parsedUrl = url.parse(`${check.protocol}://${check.url}`, true);
  const hostname = parsedUrl.hostname;
  const path = parsedUrl.path; // not using `pathname` because we want the querystring too

  // Construct the request
  const requestOptions = {
    hostname: hostname,
    method: check.method.toUpperCase(),
    path: path,
    timeout: check.timeoutSeconds * 1000, // Multiply by 1000 to transform seconds to milliseconds
  };

  const protocol = check.protocol === "https" ? https : http;
  const req = protocol.request(requestOptions, res => {
    checkOutcome.responseCode = res.statusCode;
    if (!outcomeSent) {
      workers.processCheckOutcome(check, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("error", e => {
    // Update the checkOutcome and pass it along
    checkOutcome.error = {
      error: true,
      value: e,
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(check, checkOutcome);
      outcomeSent = true;
    }
  })

  req.on("timeout", () => {
    // Update the checkOutcome and pass it along
    checkOutcome.error = {
      error: true,
      value: 'timeout',
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(check, checkOutcome);
      outcomeSent = true;
    }
  })

  // Send the request
  req.end();

};

workers.runAllChecks = async () => {
  // Find all checks
  let checkIds = [];
  checkIds = await db.list("checks").catch();
  if (!checkIds.length) { console.log(`Could not find any checks to process`); }

  // Perform a check for each checkId
  checkIds.forEach(async id => {
    const originalCheck = await db.read("checks", id)
      .catch(e => console.log(`Could not read check data for id: ${id}`));
    const validCheck = workers.validateCheckData(originalCheck);
    if (!validCheck) { return; }
    workers.runOneCheck(validCheck); // asynchronous function
  });
};

workers.init = () => {
  // Execute all checks immediately
  workers.runAllChecks(); // asynchronous function
  // Then execute the checks every `checkInterval` (milliseconds)
  setInterval(() => workers.runAllChecks(), checkInterval);
};



module.exports = workers;