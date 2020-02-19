const litmus = require("../lib/litmus");
const logger = require("../src/logger");
const assert = require("assert");
const path = require("path");



litmus.testThat(
  "logger.decompressFile should return a string if no second argument is provided",
  async (failureHandler, successHandler) => {
    let logFileNames = await logger.listLogFilenames(false);
    let compressedLog = logFileNames.find(i => i.endsWith(".gz.b64"));
    compressedLog = path.join(logger.baseDir, compressedLog);
    let logString = await logger.decompressFile(compressedLog);
    try {
      assert.equal(typeof (logString), "string");
    } catch (e) {
      failureHandler(e);
      return;
    }
    successHandler();
  });

litmus.testThat(
  "logger.decompressFile returns a string of json objects separated by newline characters",
  async (failureHandler, successHandler) => {
    let logFileNames = await logger.listLogFilenames(false);
    let compressedLog = logFileNames.find(i => i.endsWith(".gz.b64"));
    compressedLog = path.join(logger.baseDir, compressedLog);
    let logString = await logger.decompressFile(compressedLog);
    let objects = logString.split("\n").filter(i => !!i);
    objects = objects.map(i => JSON.parse(i));
    try {
      objects.forEach(i => assert.equal(typeof (i), "object"));
    } catch (e) {
      failureHandler(e);
      return;
    }
    successHandler();
  });

litmus.testThat(
  "logger.listLogFilenames returns an array of strings",
  async (failureHandler, successHandler) => {
    try {
      let logFileNames = await logger.listLogFilenames(false);
      assert.ok(Array.isArray(logFileNames));
      assert.equal(typeof(logFileNames[0]), "string");
    } catch (e) {
      failureHandler(e);
      return;
    }
    successHandler();
  });