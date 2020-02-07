/**
 * Library to interface with Twilio's REST API.
 */

const https = require("https");
const querystring = require("querystring");

const config = require("../../src/config");



module.exports.sendSms = function (phone, message, callback) {
  // Generate `Basic Auth` token from username and password
  const basicAuth = Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`)
    .toString("base64");
  const options = {
    "method": "POST",
    "hostname": config.twilio.hostName,
    "path": `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages`,
    "headers": {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basicAuth}`
    },
  };
  
  const req = https.request(options, function (res) {
    let chunks = [];
  
    res.on("data", chunk => chunks.push(chunk));
  
    res.on("end", () => {
      const body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  
    res.on("error", e => callback(e));
  });
  
  const postData = querystring.stringify({
    "From": config.twilio.fromPhone,
    "To": phone,
    "Body": message
  });
  
  req.write(postData);
  req.end();
}