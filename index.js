const server = require("./src/server");



const app = {};

app.init = () => {
  server.init();
}

app.init();



module.exports = app;