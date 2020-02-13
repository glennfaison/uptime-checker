const templatr = require("../../lib/templatr");



const uiHandler = {};


uiHandler.index = async (req, res) => {
  
  let str = await templatr.getTemplate("index.html", { appName: "Checks App", heading: "My heading"});
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
  
};



module.exports = uiHandler;