const servers = require("./src/servers");
const workers = require("./src/workers");



const app = {};

app.init = () => {
  servers.init();
  workers.init();
};

app.init();



module.exports = app;