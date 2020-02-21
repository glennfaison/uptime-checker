const _os = require("os");
const _cluster = require("cluster");

const servers = require("./src/servers");
const workers = require("./src/workers");
const cli = require("./src/cli");



const app = {};

app.init = () => {
  if (_cluster.isMaster) {
    // Make as many forks of this process as there are CPUs
    _os.cpus().forEach(i => _cluster.fork());

    // Start worker thread and CLI
    workers.init();
    setTimeout(() => cli.init(), 2000);
  }

  // Start only the servers and return if we're not in the master cluster
  if (!_cluster.isMaster) {
    servers.init();
  }
};

// Automatically start the application only if this file is run by node.
// (Don't run if this file is required by another file)
if (require.main === module) {
  app.init();
}



module.exports = app;