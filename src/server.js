const fs = require("fs");

const { handlers } = require("./handlers");
const env = require("./config");
const Srvr = require("../lib/srvr");
const twilight = require("../lib/twilight");



const server = {};

server.httpsOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};

// Create an HTTPS server
server.httpsServer = Srvr("https", server.httpsOptions);

/* Routing for the application */

// Create an HTTP server
server.httpServer = Srvr();

/* Routing for the application */
server.httpServer.route("ping/:id").get((req, res) => {
  console.log(req.params, req.query, req.body);
  res.json({}, 200);
});

server.httpServer
  .route("users")
  .get(handlers.users.get)
  .post(handlers.users.post)
  .put(handlers.users.put)
  .delete(handlers.users.delete);

server.httpServer
  .route("tokens")
  .get(handlers.tokens.get)
  .post(handlers.tokens.post)
  .put(handlers.tokens.put)
  .delete(handlers.tokens.delete);

server.httpServer
  .route("checks")
  .get(handlers.checks.get)
  .post(handlers.checks.post)
  .put(handlers.checks.put)
  .delete(handlers.checks.delete);



server.init = () => {
  // Start the HTTP server
  server.httpServer.listen(env.httpPort, () => {
    console.log(`Application is listening on port ${env.httpPort}, in ${env.envName} mode`);
  });
  // Start the HTTPS server
  server.httpsServer.listen(env.httpsPort, () => {
    console.log(`Application is listening on port ${env.httpsPort}, in ${env.envName} mode`);
  });
}


// @TODO GET RID OF THIS!!!
// twilight.sendSms("+237675611933", "Hi there!", res => {
//   console.log(res);
// });

module.exports = server;