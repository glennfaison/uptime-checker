const templatr = require("../../lib/templatr");



const uiHandler = {};

const defaultData = {
  appName: "Uptime Checker",
  head:{
    title: "Uptime Monitoring - Made Simple",
    description: "We offer free, simple uptime monitoring for HTTP and HTTPS sites of all kinds. When your site goes down, we'll send you a text to let you know!",
  },
  body: {
    class: "index",
    description: "We offer free, simple uptime monitoring for HTTP and HTTPS sites of all kinds. When your site goes down, we'll send you a text to let you know!",
  },
};



uiHandler.index = async (req, res) => {
  let str = templatr.renderTemplate("index.html", { ...defaultData });
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};

uiHandler.accountCreate = async (req, res) => {
  const data = { ...defaultData };
  data.head.title = "Create an Account";
  data.head.description = "Signup is easy and only takes a few seconds";
  data.body.class = "accountCreate";

  let str = templatr.renderTemplate("index.html", data);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};



module.exports = uiHandler;