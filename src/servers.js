const fs = require("fs");
const path = require("path");

const { handlers } = require("./handlers");
const env = require("./config");
const Srvr = require("../lib/srvr");
const templatr = require("../lib/templatr");
const config = require("./config");



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


/* UI-related paths */
// Serve all files in the `public` folder as static resources
const publicFolder = path.resolve(path.join(__dirname, ".."), "public");
servers.httpServer.serveStatic("/", publicFolder);

servers.httpServer
  .route("/")
  .get(handlers.ui.index);


templatr.appName = config.appName;
templatr.appDescription = config.appDescription;


servers.init = () => {
  process.on("uncaughtException", e => console.log(e));
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