const fs = require("fs");

const { handlers } = require("./src/handlers");
const env = require("./src/config");
const Srvr = require("./lib/srvr");
const twilight = require("./lib/twilight");



const httpsOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};

// Create an HTTPS server
const httpsServer = Srvr("https", httpsOptions);

httpsServer.listen(env.httpsPort, () => {
  console.log(`Application is listening on port ${env.httpsPort}, in ${env.envName} mode`);
});

/* Routing for the application */

// Create an HTTP server
const httpServer = Srvr();

httpServer.listen(env.httpPort, () => {
  console.log(`Application is listening on port ${env.httpPort}, in ${env.envName} mode`);
});

/* Routing for the application */
httpServer.route("ping/:id").get((req, res) => {
  console.log(req.params, req.query, req.body);
  res.json({}, 200);
});

httpServer
  .route("users")
  .get(handlers.users.get)
  .post(handlers.users.post)
  .put(handlers.users.put)
  .delete(handlers.users.delete);

httpServer
  .route("tokens")
  .get(handlers.tokens.get)
  .post(handlers.tokens.post)
  .put(handlers.tokens.put)
  .delete(handlers.tokens.delete);

httpServer
  .route("checks")
  .get(handlers.checks.get)
  .post(handlers.checks.post)
  .put(handlers.checks.put)
  .delete(handlers.checks.delete);


// @TODO GET RID OF THIS!!!
// twilight.sendSms("+237675611933", "Hi there!", res => {
//   console.log(res);
// });