const fs = require("fs");
const path = require("path");



const uiHandler = {};
uiHandler.basePath = path.join(__dirname, "../../public");

uiHandler.index = async (req, res) => {
  const fullPath = path.join(uiHandler.basePath, "index.html");
  res.setHeader("content-type", "text/html");
  let stream;
  try {
    stream = fs.createReadStream(fullPath, { encoding: "utf-8" });
  } catch (e) {
    res.writeHead(404);
    return res.end("");
  }
  res.writeHead(200);
  return stream.pipe(res);
};



module.exports = uiHandler;