const path = require("path");
const fs = require("fs");
const zlib = require("zlib");



const logger = {};



logger.baseDir = path.join(__dirname, "../.logs");

logger.append = async (filename, data, callback) => {
  const fullPath = path.join(logger.baseDir, `${filename}.log`);
  // Create the file if it doesn't exist; append if it does.
  let fd;
  try {
    fd = fs.openSync(fullPath, "a");
  } catch (e) { }
  if (!fd) { callback(`Could not open file for appending.`); }
  try {
    fs.appendFileSync(fd, `${data}\n`);
  } catch (e) { callback(`Error appending to file.`); }
  try {
    fs.closeSync(fd);
  } catch (e) { callback(`Error closing file after appending.`); }
  callback(false);
};

logger.listLogFilenames = async (hideCompressedLogs = true) => {
  let logFilenames = fs.readdirSync(logger.baseDir);
  if (hideCompressedLogs) {
    logFilenames = logFilenames.filter(i => i.endsWith(".log"));
  }
  return logFilenames;
};

logger.clearFile = async (source) => {
  try {
    fs.truncateSync(source, 0);
  } catch (e) { throw e; }
};

logger.compress = async (source, compressed) => {
  let str;
  try {
    str = fs.readFileSync(source, { encoding: "utf-8" });
  } catch (e) {
    console.log(`Cannot read log file: ${source}`);
    return;
  }
  let buffer;
  try {
    buffer = zlib.gzipSync(str);
  } catch (e) {
    console.log(`Cannot compress the data in: ${source}`);
    return;
  }
  let fd;
  try {
    fd = fs.openSync(compressed, "wx");
  } catch (e) { console.log(`Cannot create compressed log. It may already exist`); }
  try {
    fs.writeFileSync(fd, buffer.toString("base64"));
  } catch (e) { console.log(`Cannot write to the compressed file`); }
  try {
    fs.closeSync(fd);
  } catch (e) { console.log(`Cannot close the file: ${compressed}`); }
};

logger.rotateLog = async (filename, compressedAt) => {
  const source = path.join(logger.baseDir, filename);
  const tmp = path.join(logger.baseDir, filename + ".tmp");
  let gzB64 = path.join(logger.baseDir, filename.replace(/\.log$/, `-${compressedAt}.gz.b64`));
  try {
    fs.copyFileSync(source, tmp);
  } catch (e) {
    console.log(`Error: could not copy ${source}!`);
    return;
  }
  // clear original log file
  try {
    await logger.clearFile(source);
  } catch (e) {
    console.log(`Error: Failed to clear file:\n${source}`);
    return;
  }
  // compress .tmp log file
  try {
    await logger.compress(tmp, gzB64);
  } catch (e) {
    console.log(`Error: Failed to compress:\n${tmp}`);
    return;
  }
  // Delete the .tmp file
  try {
    await fs.unlinkSync(tmp);
  } catch (e) { console.log(`Error: could not remove temporary file`, e); }
}

// Run compression on all deflated logs, then empty the deflated log
logger.rotateDeflatedLogs = async () => {
  // Get all deflated filenames
  const logFilenames = await logger.listLogFilenames();
  const compressedAt = Date.now();
  // For each deflated log file, rotate it
  logFilenames.forEach(filename => logger.rotateLog(filename, compressedAt));
};



module.exports = logger;
