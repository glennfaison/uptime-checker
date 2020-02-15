const templatr = require("../../lib/templatr");



const uiHandler = {};

const defaultData = () => ({
  head:{
    appName: "Uptime Checker",
    title: "Uptime Monitoring - Made Simple",
    description: "We offer free, simple uptime monitoring for HTTP and HTTPS sites of all kinds. When your site goes down, we'll send you a text to let you know!",
  },
  body: {
    class: "index",
    description: "We offer free, simple uptime monitoring for HTTP and HTTPS sites of all kinds. When your site goes down, we'll send you a text to let you know!",
  },
  footer: {
    companyName: "Not a Real Company Ltd.",
    yearCreated: 2020,
  },
});



uiHandler.index = async (req, res) => {
  let str = templatr.renderTemplate("index.html", defaultData());
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};

// Create Account
uiHandler.accountCreate = async (req, res) => {
  const data = defaultData();
  data.head.title = "Create an Account";
  data.head.description = "Signup is easy and only takes a few seconds";
  data.body.class = "accountCreate";

  let str = templatr.renderTemplate("accountCreate.html", data);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};

// Create New Session
uiHandler.sessionCreate = async (req, res) => {
  const data = defaultData();
  data.head.title = "Login to Your Account";
  data.head.description = "Please enter your phone number and password to access your account";
  data.body.class = "sessionCreate";

  let str = templatr.renderTemplate("sessionCreate.html", data);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};

// Edit Your Account
uiHandler.accountEdit = async (req, res) => {
  const data = defaultData();
  data.head.title = "Account Settings";
  data.body.class = "accountEdit";

  let str = templatr.renderTemplate("accountEdit.html", data);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};

// Session has been deleted
uiHandler.sessionDeleted = async (req, res) => {
  const data = defaultData();
  data.head.title = "Logged Out";
  data.head.description = "You have been logged out of your account.";
  data.body.class = "sessionDeleted";

  let str = templatr.renderTemplate("sessionDeleted.html", data);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};

// Account has been deleted
uiHandler.accountDeleted = async (req, res) => {
  const data = defaultData();
  data.head.title = "Account Deleted";
  data.head.description = "Your account has been deleted.";
  data.body.class = "accountDeleted";

  let str = templatr.renderTemplate("accountDeleted.html", data);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};

// Create a new check
uiHandler.checksCreate = async (req, res) => {
  const data = defaultData();
  data.head.title = "Create a New Check";
  data.body.class = "checksCreate";

  let str = templatr.renderTemplate("checksCreate.html", data);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};

// Dashboard (view all checks)
uiHandler.checksList = async (req, res) => {
  const data = defaultData();
  data.head.title = "Dashboard";
  data.body.class = "checksList";

  let str = templatr.renderTemplate("checksList.html", data);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};

// Edit a Check
uiHandler.checksEdit = async (req, res) => {
  const data = defaultData();
  data.head.title = "Check Details";
  data.body.class = "checksEdit";

  let str = templatr.renderTemplate("checksEdit.html", data);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200, "OK");
  return res.end(str);
};



module.exports = uiHandler;