const templatr = require("../../lib/templatr");



const uiHandler = {};



uiHandler.index = async (req, res) => {
  let str = templatr.renderTemplate("index.html");
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};



module.exports = uiHandler;