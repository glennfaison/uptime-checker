const events = require("events");
const readline = require("readline");
const debuglog = require("util").debuglog("cli");
const os = require("os");
const v8 = require("v8");

const db = require("./db");
const logger = require("./logger");


class E extends events.EventEmitter { };
const e = new E();



const manObject = {
  'exit': {
    "args": [],
    "description": 'Kill the CLI (and the rest of the application)'
  },
  'man': {
    "args": [],
    "description": 'Show this help page'
  },
  'help': {
    "args": [],
    "description": 'Alias of the \x1b[33mman\x1b[0m command'
  },
  'stats': {
    "args": [],
    "description": 'Get statistics on the underlying operating system and resource utilization'
  },
  'list users': {
    "args": [],
    "description": 'Show a list of all the registered (undeleted) users in the system'
  },
  'more user info': {
    "args": ["userId",],
    "description": 'Show details of a specified user'
  },
  'list checks': {
    "args": ["up", "down",],
    "description": 'Show a list of all the active checks in the system, including their state. The "--up" and "--down flags are both optional."'
  },
  'more check info': {
    "args": ["checkId",],
    "description": 'Show details of a specified check'
  },
  'list logs': {
    "args": [],
    "description": 'Show a list of all the log files available to be read (compressed and uncompressed)'
  },
  'more log info': {
    "args": ["logFileName",],
    "description": 'Show details of a specified log file'
  },
};



const _interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ">",
});

const cli = {};



cli.commands = {};

// Exit
cli.commands.exit = () => {
  console.log("Exiting CLI now...");
  process.exit(0);
};

// Help / Man
cli.commands.help = () => {

  // Codify the commands and their explanations
  var commands = { ...manObject };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command, followed by its explanation, in white and yellow respectively
  for (var key in commands) {
    var value = commands[key].description;
    var line = `      \x1b[33m ${key}      \x1b[0m`;
    var padding = 60 - line.length;
    line += new Array(padding).fill(' ').join('');
    line += value;
    console.log(line);
    cli.verticalSpace();
  }
  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();

};

// Stats
cli.commands.stats = () => {
  // Compile an object of stats
  var stats = {
    'Load Average': os.loadavg().join(' '),
    'CPU Count': os.cpus().length,
    'Free Memory': os.freemem(),
    'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
    'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
    'Allocated Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
    'Available Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
    'Uptime': os.uptime() + ' Seconds'
  };

  // Create a header for the stats
  cli.horizontalLine();
  cli.centered('SYSTEM STATISTICS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Log out each stat
  for (var key in stats) {
    var value = stats[key];
    var line = `      \x1b[33m ${key}      \x1b[0m`;
    var padding = 60 - line.length;
    line += new Array(padding).fill(' ').join('');
    line += value;
    console.log(line);
    cli.verticalSpace();
  }

  // Create a footer for the stats
  cli.verticalSpace();
  cli.horizontalLine();

};

// List Users
cli.commands.listUsers = async () => {
  const userIds = await db.list('users');
  if (userIds.length == 0) { return; }
  cli.verticalSpace();

  userIds.forEach(async (userId) => {
    const userData = await db.read('users', userId);
    if (!userData) { return; }
    var line = 'Name: ' + userData.firstName + ' ' + userData.lastName + ' Phone: ' + userData.phone + ' Checks: ';
    var numberOfChecks = Array.isArray(userData.checks) && userData.checks.length > 0 ? userData.checks.length : 0;
    line += numberOfChecks;
    console.log(line);
    cli.verticalSpace();
  });
};

// More user info
cli.commands.moreUserInfo = async (str) => {
  // Get ID from string
  var arr = str.split('--');
  var userId = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if (!userId) { return; }
  // Lookup the user
  const userData = await db.read('users', userId).catch(e => {}); // catch any error and do nothing
  if (!userData) { return; }

  // Remove the hashed password
  delete userData.hashedPassword;

  // Print their JSON object with text highlighting
  cli.verticalSpace();
  console.dir(userData, { 'colors': true });
  cli.verticalSpace();

};

// List Checks
cli.commands.listChecks = async (str) => {
  let checkIds = await db.list('checks').catch(e => {});
  if (!checkIds || checkIds.length <= 0) { return; }
  cli.verticalSpace();
  checkIds.forEach(async (checkId) => {
    let checkData = await db.read('checks', checkId);
    if (!checkData) { return; }
    var includeCheck = false;
    var lowerString = str.toLowerCase();
    // Get the state, default to down
    var state = typeof (checkData.state) == 'string' ? checkData.state : 'down';
    // Get the state, default to unknown
    var stateOrUnknown = typeof (checkData.state) == 'string' ? checkData.state : 'unknown';
    // If the user has specified that state, or hasn't specified any state
    if (lowerString.includes('--' + state) || (lowerString.includes('--down') && lowerString.includes('--up'))) {
      var line = 'ID: ' + checkData.id + ' ' + checkData.method.toUpperCase() + ' ' + checkData.protocol + '://' + checkData.url + ' State: ' + stateOrUnknown;
      console.log(line);
      cli.verticalSpace();
    }
  });
};

// More check info
cli.commands.moreCheckInfo = async (str) => {
  // Get ID from string
  var arr = str.split('--');
  var checkId = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if (!checkId) { return; }
  // Lookup the user
  let checkData = await db.read('checks', checkId).catch(e => {});
  if (!checkData) { return; }

  // Print their JSON object with text highlighting
  cli.verticalSpace();
  console.dir(checkData, { 'colors': true });
  cli.verticalSpace();
};

// List Logs
cli.commands.listLogs = async () => {
  let logFileNames = await logger.listLogFilenames(true).catch(e => {});
  if (!logFileNames || logFileNames.length <= 0) { return; }
  cli.verticalSpace();
  logFileNames.forEach((logFileName) => {
    if (logFileName.includes('-')) {
      console.log(logFileName);
      cli.verticalSpace();
    }
  });
};

// More logs info
cli.commands.moreLogInfo = async (str) => {
  // Get logFileName from string
  var arr = str.split('--');
  var logFileName = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if (!logFileName) { return; }
  cli.verticalSpace();
  // Decompress it
  let strData = await logger.decompressFile(logFileName).catch(e => {});
  if (!strData) { return; }
  // Split it into lines
  var arr = strData.split('\n');
  arr.forEach((jsonString) => {
    var logObject = helpers.parseJsonToObject(jsonString);
    if (logObject && JSON.stringify(logObject) !== '{}') {
      console.dir(logObject, { colors: true });
      cli.verticalSpace();
    }
  });
};



e.on("exit", cli.commands.exit);

e.on('man', cli.commands.help);

e.on('help', cli.commands.help);

e.on('stats', cli.commands.stats);

e.on('list users', cli.commands.listUsers);

e.on('more user info', cli.commands.moreUserInfo);

e.on('list checks', cli.commands.listChecks);

e.on('more check info', cli.commands.moreCheckInfo);

e.on('list logs', cli.commands.listLogs);

e.on('more log info', cli.commands.moreLogInfo);



cli.init = () => {
  console.log("\x1b[34m%s\x1b[0m", "The CLI is now running");
  // Start the interface
  _interface.prompt();

  // Process user input every time it is available
  _interface.on("line", line => {
    // Separate every incoming token with exactly one space character
    line = line.trim().split(/\s/g).join(" ");

    // Ignore this input if it doesn't contain text
    if (!line) { return; }

    // List valid arguments for this CLI
    const validArgs = Object.keys(manObject);

    // Emit the appropriate event for the user input
    const lineIsValid = validArgs.some(command => {
      if (`${line} `.startsWith(`${command} `)) {
        let args = line.substring(`${command} `.length);
        e.emit(command, args);
        return true;
      }
    });

    if (!lineIsValid) { console.log("Sorry, try again."); }

    // Prompt the user for imput once more
    _interface.prompt();

  });

  _interface.on("close", cli.commands.exit);

};

// Create a vertical space
cli.verticalSpace = (lines) => {
  lines = typeof (lines) == 'number' && lines > 0 ? lines : 1;
  for (i = 0; i < lines; i++) {
    console.log('');
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = () => {
  // Get the available screen size
  var width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  var line = new Array(width).fill('-').join('');
  console.log(line);
};

// Create centered text on the screen
cli.centered = (str) => {
  str = typeof (str) == 'string' && str.trim().length > 0 ? str.trim() : '';

  // Get the available screen size
  var width = process.stdout.columns;

  // Calculate the left padding there should be
  var leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  var line = new Array(leftPadding).fill(' ').join('');
  line += str;
  console.log(line);
};



module.exports = cli;