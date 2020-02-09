const fs = require("fs");

const { handlers } = require("./handlers");
const env = require("./config");
const Srvr = require("../lib/srvr");



const servers = {};

servers.httpsOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};

// Create an HTTPS server
servers.httpsServer = Srvr("https", servers.httpsOptions);

/* Routing for the application */

// Create an HTTP server
servers.httpServer = Srvr();

/* Routing for the application */
servers.httpServer.route("ping/:id").get((req, res) => {
  console.log(req.params, req.query, req.body);
  res.json({}, 200);
});

servers.httpServer
  .route("users")
  .get(handlers.users.get)
  .post(handlers.users.post)
  .put(handlers.users.put)
  .delete(handlers.users.delete);

servers.httpServer
  .route("tokens")
  .get(handlers.tokens.get)
  .post(handlers.tokens.post)
  .put(handlers.tokens.put)
  .delete(handlers.tokens.delete);

servers.httpServer
  .route("checks")
  .get(handlers.checks.get)
  .post(handlers.checks.post)
  .put(handlers.checks.put)
  .delete(handlers.checks.delete);



servers.init = () => {
  process.on("uncaughtException", e => console.log(e));
  // Start the HTTP server
  servers.httpServer.listen(env.httpPort, () => {
    console.log(`Application is listening on port ${env.httpPort}, in ${env.envName} mode`);
  });
  // Start the HTTPS server
  servers.httpsServer.listen(env.httpsPort, () => {
    console.log(`Application is listening on port ${env.httpsPort}, in ${env.envName} mode`);
  });
};



module.exports = servers;