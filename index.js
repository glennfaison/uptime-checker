const servers = require("./src/servers");
const workers = require("./src/workers");
const cli = require("./src/cli");



const app = {};

app.init = () => {
  servers.init();
  workers.init();
  setTimeout(() => cli.init(), 2000);
};

// Automatically start the application only if this file is run by node.
// (Don't run if this file is required by another file)
if (require.main === module) {
  app.init();
}



module.exports = app;