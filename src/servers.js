const fs = require("fs");
const path = require("path");

const { handlers } = require("./handlers");
const env = require("./config");
const Srvr = require("../lib/srvr")



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
  res.setStatus(200).json();
});

servers.httpServer
  .route("api/v1/users")
  .get(handlers.users.get)
  .post(handlers.users.post)
  .put(handlers.users.put)
  .delete(handlers.users.delete);

servers.httpServer
  .route("api/v1/tokens")
  .get(handlers.tokens.get)
  .post(handlers.tokens.post)
  .put(handlers.tokens.put)
  .delete(handlers.tokens.delete);

servers.httpServer
  .route("api/v1/checks")
  .get(handlers.checks.get)
  .post(handlers.checks.post)
  .put(handlers.checks.put)
  .delete(handlers.checks.delete);


/* UI-related paths */
// Serve all files in the `public` folder as static resources
const publicFolder = path.resolve(path.join(__dirname, ".."), "public");
servers.httpServer.serveStatic("/", publicFolder);

servers.httpServer.route("/").get(handlers.ui.index);
servers.httpServer.route("/account/create").get(handlers.ui.accountCreate);
servers.httpServer.route("/account/edit").get(handlers.ui.accountEdit);
servers.httpServer.route("/account/deleted").get(handlers.ui.accountDeleted);
servers.httpServer.route("/session/create").get(handlers.ui.sessionCreate);
servers.httpServer.route("/session/deleted").get(handlers.ui.sessionDeleted);
servers.httpServer.route("/checks/all").get(handlers.ui.checksList);
servers.httpServer.route("/checks/create").get(handlers.ui.checksCreate);
servers.httpServer.route("/checks/edit").get(handlers.ui.checksEdit);



servers.init = () => {
  process.on("uncaughtException", e => console.log(e));
  process.on("unhandledRejection", e => console.log(e));

  // Start the HTTP server
  servers.httpServer.listen(env.httpPort, () => {
    console.log("\x1b[36m%s\x1b[0m", `Application is listening on port ${env.httpPort}, in ${env.envName} mode`);
  });
  // Start the HTTPS server
  servers.httpsServer.listen(env.httpsPort, () => {
    console.log("\x1b[35m%s\x1b[0m", `Application is listening on port ${env.httpsPort}, in ${env.envName} mode`);
  });
};



module.exports = servers;