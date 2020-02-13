const fs = require("fs");
const path = require("path");



const templatr = {};
templatr.templateHome = path.join(__dirname, "../../src/templates");



templatr.getTemplate = async (templatePath, data) => {
  if (!templatePath || typeof (templatePath) !== "string") { return ""; }
  data = !!data && typeof (data) === "object" ? data : {};
  templatePath = path.join(templatr.templateHome, templatePath);
  data = {
    ...data,
    getTemplate: templatr.getTemplate,
   };

  let templateString = "";
  try {
    templateString = fs.readFileSync(templatePath, { encoding: "utf-8" });
  } catch (e) { console.log(`Could not read template file.`); }

  // Replace all code in double curly braces with corresponding data
  const variableMarker = /\{\{(.+)\}\}/g;
  let match, result;
  while (match = variableMarker.exec(templateString)) {
    console.log(match[0], match[1])
    try {
      result = templatr.evaluate(match[1], data);
    } catch (e) { throw e; }
    templateString = templateString.replace(match[0], result);
  }

  return templateString;
};

templatr.evaluate = function (str, data) {
  let s = "";
  // Declare the keys in `data` as variables in current scope
  for (let key in data) {
    if (typeof(data[key]) === "number") {
      s += `let ${key} = ${data[key]};`;
    }
    if (typeof(data[key]) === "string") {
      s += `let ${key} = "${data[key]}";`;
    }
    if (typeof(data[key]) === "object") {
      s += `let ${key} = JSON.parse(${JSON.stringify(data[key])});`;
    }
    if (typeof(data[key]) === "function") {
      s += `let ${key} = ${data[key].toString()};`;
    }
  }
  // Finally, add the string which had to originally be evaluated
  s += str;

  return eval(s);
};



module.exports = templatr;