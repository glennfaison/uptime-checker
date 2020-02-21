const fs = require("fs");
const path = require("path");
const vm = require("vm");



const templatr = {};
templatr.templateHome = path.join(__dirname, "../../templates");



templatr.getTemplateString = (templatePath) => {
  let str;
  try {
    str = fs.readFileSync(templatePath, { encoding: "utf-8" });
  } catch (e) {
    console.log(`Could not read file: ${templatePath}`);
    return "";
  }
  return str;
};

templatr.processTemplateString = (str, data) => {
  const opener = "{%", closer = "%}";

  let closerIndex = str.indexOf(closer);
  let openerIndex = str.lastIndexOf(opener, closerIndex);

  const matchFound = openerIndex < closerIndex && openerIndex !== -1 && closerIndex !== -1;
  if (!matchFound) { return str; }

  let match = str.substring(openerIndex, closerIndex + 2);
  let expression = match.substring(2, match.length - 2);

  let res = templatr.evaluate(expression, data);

  str = str.replace(match, res);

  return templatr.processTemplateString(str, data)
};

templatr.evaluate = function (str, data) {
  let script = new vm.Script(str);
  let res;
  try {
    res = script.runInNewContext(data);
    // res = eval(s);
  } catch (e) { res += e; }
  return res;
};

templatr.renderTemplate = (templatePath, data) => {
  if (!templatePath || typeof (templatePath) !== "string") { return ""; }
  data = !!data && typeof (data) === "object" ? data : {};
  templatePath = path.join(templatr.templateHome, templatePath);
  data = { ...data, renderTemplate: templatr.renderTemplate };

  let templateString = templatr.getTemplateString(templatePath);

  return templatr.processTemplateString(templateString, data);
};



module.exports = templatr;