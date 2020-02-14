const fs = require("fs");
const path = require("path");



const templatr = {};
templatr.templateHome = path.join(__dirname, "../../src/templates");
templatr.appName = "";
templatr.appDescription = "";



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

templatr.renderTemplate = (templatePath, data) => {
  if (!templatePath || typeof (templatePath) !== "string") { return ""; }
  data = !!data && typeof (data) === "object" ? data : {};
  templatePath = path.join(templatr.templateHome, templatePath);
  data = {
    ...data,
    renderTemplate: templatr.renderTemplate,
    appName: templatr.appName,
    appDescription: templatr.appDescription,
  };

  let templateString = templatr.getTemplateString(templatePath);

  // Replace all code in double curly braces with corresponding data
  const variableMarker = /\{\%(.+?)\%\}/g;

  let templateExpressions = templateString.match(variableMarker);
  templateExpressions = templateExpressions ? [ ...templateExpressions ] : [];
  let expressions = templateExpressions.map(i => i.trim().replace(/^\{\%|\%\}$/g, ""));
  let res;
  expressions.forEach((exp, idx) => {
    try {
      res = templatr.evaluate(exp, data);
    } catch (e) { throw e; }
    templateString = templateString.replace(templateExpressions[idx], res);
  })

  return templateString;
};

templatr.evaluate = function (str, data) {
  let s = "";
  // Declare the keys in `data` as variables in current scope
  for (let key in data) {
    if (typeof (data[key]) === "number") {
      s += `let ${key} = ${data[key]};`;
    }
    if (typeof (data[key]) === "string") {
      s += `let ${key} = "${data[key]}";`;
    }
    if (typeof (data[key]) === "object") {
      s += `let ${key} = ${JSON.stringify(data[key])};`;
    }
    if (typeof (data[key]) === "function") {
      s += `let ${key} = ${data[key].toString()};`;
    }
  }
  // Finally, add the string which had to originally be evaluated
  s += str;

  return eval(s);
};



module.exports = templatr;