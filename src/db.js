// Rudimentary file-based DB.
// TODO: replace with textdb
const fs = require("fs");
const path = require("path");

const lib = {};

lib.baseDir = path.join(__dirname, "../.data");

lib.create = async (dir, file, data) => {
  let fullPath, fd, stringData;
  try {
    fullPath = path.join(lib.baseDir, dir, file + ".json");
    fd = fs.openSync(fullPath, "wx");
    stringData = JSON.stringify(data);
  } catch (e) {
    console.log("Could not create new file. It may already exist");
    return false;
  }
  try {
    fs.writeFileSync(fd, stringData);
  } catch (e) {
    console.log("Could not write to file");
    return false;
  }
  try {
    fs.closeSync(fd);
    return true;
  } catch (e) {
    console.log("Error while closing file");
    return false;
  }
};

lib.read = async (dir, file) => {
  const fullPath = path.join(lib.baseDir, dir, file + ".json");
  let data = null;
  try {
    data = fs.readFileSync(fullPath, "utf-8");
  } catch (e) {
    console.log("Error reading file. File may not exist");
    return null;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

lib.update = async (dir, file, data) => {
  let fullPath, fd, stringData;
  try {
    fullPath = path.join(lib.baseDir, dir, file + ".json");
    // Empty the file
    fs.truncateSync(fullPath, 0);
    fd = fs.openSync(fullPath, "r+");
    stringData = JSON.stringify(data);
  } catch (e) {
    console.log("Error opening file. It may not exist yet");
    return false;
  }
  try {
    fs.writeFileSync(fd, stringData);
  } catch (e) {
    console.log("Error updating file");
    return false;
  }
  try {
    fs.closeSync(fd);
    return true;
  } catch (e) {
    console.log("Could not close file after update");
    return false;
  }
};

lib.delete = async (dir, file) => {
  try {
    const fullPath = path.join(lib.baseDir, dir, file + ".json");
    fs.unlinkSync(fullPath);
    return true;
  } catch (e) {
    console.log("Could not delete the file.");
    return false;
  }
};

module.exports = lib;
