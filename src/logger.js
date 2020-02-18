const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const util = require("util");

const debuglog = util.debuglog("logger");



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

logger.compressFile = async (source, compressed) => {
  let str;
  try {
    str = fs.readFileSync(source, { encoding: "utf-8" });
  } catch (e) {
    debuglog(`Cannot read log file: ${source}`);
    return;
  }
  let buffer;
  try {
    buffer = zlib.gzipSync(str);
  } catch (e) {
    debuglog(`Cannot compress the data in: ${source}`);
    return;
  }
  let fd;
  try {
    fd = fs.openSync(compressed, "wx");
  } catch (e) { debuglog(`Cannot create compressed log. It may already exist`); }
  try {
    fs.writeFileSync(fd, buffer.toString("base64"));
  } catch (e) { debuglog(`Cannot write to the compressed file`); }
  try {
    fs.closeSync(fd);
  } catch (e) { debuglog(`Cannot close the file: ${compressed}`); }
};

logger.decompressFile = async (source, decompressed) => {
  let str;
  try {
    str = fs.readFileSync(source, { encoding: "utf-8" });
  } catch (e) {
    debuglog(`Could not read from the source file
    ${source}`);
    return;
  }
  let buffer = Buffer.from(str, "base64");
  try {
    buffer = zlib.unzipSync(buffer);
  } catch (e) {
    debuglog(`Could not unzip source file`);
    return;
  }
  if (!decompressed) {
    return buffer.toString("utf-8");
  }
  let fd;
  try {
    fd = fs.openSync(decompressed, "w");
    fs.truncateSync(decompressed, 0); // Empty the file
  } catch (e) { debuglog(`Could not create the destination file`); }
  try {
    debuglog(fd);
    fs.writeFileSync(fd, buffer.toString("utf-8"), { encoding: "utf-8" });
  } catch (e) { debuglog(`Could not write to destination file`); }
  try {
    fs.closeSync(fd);
  } catch (e) { debuglog(`Failed to close file: ${decompressed}`); }
};

logger.rotateLog = async (filename, compressedAt) => {
  const source = path.join(logger.baseDir, filename);
  const tmp = path.join(logger.baseDir, filename + ".tmp");
  let gzB64 = path.join(logger.baseDir, filename.replace(/\.log$/, `-${compressedAt}.gz.b64`));
  try {
    fs.copyFileSync(source, tmp);
  } catch (e) {
    debuglog(`Error: could not copy ${source}!`);
    return;
  }
  // clear original log file
  try {
    await logger.clearFile(source);
  } catch (e) {
    debuglog(`Error: Failed to clear file:\n${source}`);
    return;
  }
  // compress .tmp log file
  try {
    await logger.compressFile(tmp, gzB64);
  } catch (e) {
    debuglog(`Error: Failed to compress:\n${tmp}`);
    return;
  }
  // Delete the .tmp file
  try {
    await fs.unlinkSync(tmp);
  } catch (e) { debuglog(`Error: could not remove temporary file`, e); }
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
