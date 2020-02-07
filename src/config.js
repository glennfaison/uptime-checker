const fs = require("fs");



let twilioJson = fs.readFileSync("./lib/twilight/twilio.config.json", { encoding: "utf-8" });
twilioJson = JSON.parse(twilioJson);

const env = {};

env.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "This is a secret",
  maxChecks: 5,
  twilio: {
    accountSid: twilioJson.accountSid,
    authToken: twilioJson.authToken,
    fromPhone: twilioJson.fromPhone,
    hostName: "api.twilio.com",
  },
};

env.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "This is also a secret",
  maxChecks: 5,
  twilio: {
    accountSid: twilioJson.accountSid,
    authToken: twilioJson.authToken,
    fromPhone: twilioJson.fromPhone,
    hostName: "api.twilio.com",
  },
};

const currentEnv = !!process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : "";

const envToExport = currentEnv in env ? env[currentEnv] : env.staging;

module.exports = envToExport;
