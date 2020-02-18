const servers = require("./src/servers");
const workers = require("./src/workers");
const cli = require("./src/cli");



const app = {};

app.init = () => {
  servers.init();
  workers.init();
  setTimeout(() => cli.init(), 2000);
};

app.init();



module.exports = app;