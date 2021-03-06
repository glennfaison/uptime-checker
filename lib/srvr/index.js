const http = require("http");
const https = require("https");
const { StringDecoder } = require("string_decoder");
const url = require("url");
const fs = require("fs");
const path = require("path");

function getRouteObj(route = "") {
  const paramNameRegExp = `\:([^/]+)`;
  const paramValueRegExp = `([^\/]+)`;
  // Replace url param names with regex for param values
  // Use this value as key for the route, and to make a regexp to match urls
  let str = `${route}\$`;
  const routeExp = str.replace(new RegExp(`${paramNameRegExp}`, "g"), paramValueRegExp);
  const paramNameGetterExp = str.replace(new RegExp(`${paramNameRegExp}`, "g"), paramNameRegExp);
  return { route, routeExp, paramNameGetterExp };
}

function Srvr(protocol, options = null) {
  protocol = protocol === "https" ? https : http;
  const decorators = [];
  const router = {};

  const next = (req, res, err, decorators = []) => {
    if (!decorators.length) { return; }
    const [fxn, ...nextDecorators] = decorators;
    fxn(req, res, err);
    next(req, res, err, nextDecorators);
  };

  const fetchRequestInfo = (req, res, err) => {
    const decoder = new StringDecoder("utf-8");
    let requeststring = "";

    // Function to end transmission on this stream and send response as JSON, with a status
    res.json = (data = "") => {
      return res.end(JSON.stringify(data));
    };
    
    res.setStatus = (statusCode, reason) => {
      res.setHeader("content-type", "application/vnd.api+json");
      if (!reason) { res.writeHead(statusCode); }
      else { res.writeHead(statusCode, reason); }
      return res;
    };

    req.on("data", data => { requeststring += decoder.write(data); });

    req.on("end", () => {
      requeststring += decoder.end();

      const parsedUrl = url.parse(req.url, true);
      const path = parsedUrl.pathname;
      const trimmedPath = path.replace(/^\/+|\/+$/g, "");

      req.method = req.method.toUpperCase();
      req.query = parsedUrl.query ? JSON.parse(JSON.stringify(parsedUrl.query)) : {};
      req.headers = req.headers ? req.headers : {};
      try {
        req.body = requeststring ? JSON.parse(requeststring) : {};
      } catch (e) { req.body = {}; }
      req.trimmedPath = trimmedPath;


      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

      // Default/fallback request handler
      let handler = (req, res) => {
        res.setHeader("Content-Type", "text/plain");
        res.writeHead(404);
        return res.end(`Resource not found`);
      };
      // Search router for request handler
      for (let routeExp in router) {
        // If a `trimmedPath` matches a `route`, use the corresponding handler
        let testPath = trimmedPath.replace(/\?.*/g, "");
        let match = trimmedPath.match(new RegExp(routeExp));
        if (!!match && testPath === match[0]) {
          const obj = router[routeExp];
          const paramNames = obj.route.match(obj.paramNameGetterExp).slice(1);
          const paramValues = trimmedPath.match(obj.routeExp).slice(1);
          /* Add url params to req object */
          req.params = {};
          paramNames.forEach((param, index) => (req.params[param] = paramValues[index]));

          handler = obj[req.method.toUpperCase()] ? obj[req.method.toUpperCase()] : handler;
          break;
        }
      }
      handler(req, res);
    });
  };

  const server = protocol.createServer(options, (req, res, err) => {
    fetchRequestInfo(req, res, err);
    next(req, res, err, decorators);
  });

  server.decorateWith = (fxn = () => { }) => {
    decorators.push(fxn);
  };

  server.addRoute = (route = "", method = "get", handler) => {
    route = route.replace(/^\/+|\/+$/g, "");
    method = method.toUpperCase();
    // Remove query string
    route = route.split("?")[0];
    const { routeExp, paramNameGetterExp } = getRouteObj(route);
    // Save to router, eliminating any older handler for the same url
    router[routeExp] = router[routeExp] || {};
    router[routeExp].route = route;
    router[routeExp].routeExp = routeExp;
    router[routeExp].paramNameGetterExp = paramNameGetterExp;
    router[routeExp][method] = handler;
  };

  server.route = (route = "") => {
    const partial = {
      get: handler => {
        server.addRoute(route, "get", handler);
        return partial;
      },
      post: handler => {
        server.addRoute(route, "post", handler);
        return server.route(route);
      },
      put: handler => {
        server.addRoute(route, "put", handler);
        return server.route(route);
      },
      delete: handler => {
        server.addRoute(route, "delete", handler);
        return server.route(route);
      }
    };
    return partial;
  };

  server.findChildPaths = (baseFilePath) => {
    const children = fs.readdirSync(baseFilePath, { withFileTypes: true });
    let filePaths = children.filter(i => i.isFile() && !i.name.startsWith("."));
    let folderPaths = children.filter(i => i.isDirectory() && !i.name.startsWith("."));

    filePaths = filePaths.map(i => path.join(baseFilePath, i.name));
    folderPaths = folderPaths.map(i => path.join(baseFilePath, i.name));

    if (!filePaths.length && !folderPaths.length) {
      return [];
    }

    // Aggregate current results with those from recursive calls on non-leaf paths
    folderPaths.forEach(i => {
      const paths = server.findChildPaths(i);
      filePaths = filePaths.concat(paths);
    });

    return filePaths;
  };

  server.isTextFile = (filename) => {
    // Read the file with no encoding for raw buffer access.
    const buf = fs.readFileSync(filename);
    let isText = true;
    for (let i = 0, len = buf.length; i < len; i++) {
      if (buf[i] > 127) { isText = false; break; }
    }
    return isText; // true iff all octets are in [0, 127].
  }

  server.getMimeType = (filename) => {
    const extension = filename.match(/\.([^\.]+$)/)[1];
    switch (extension) {
      case "css": return "text/css";
      case "csv": return "text/csv";
      case "htm": return "text/html";
      case "html": return "text/html";
      case "xml": return "application/xml";
      case "js": return "application/javascript";
      case "ejs": return "application/javascript";
      case "mjs": return "application/javascript";
      case "json": return "application/vnd.api+json";
      case "ico": return "image/x-icon";
      case "jpg": return "image/jpeg";
      case "jpeg": return "image/jpeg";
      case "bmp": return "image/bmp";
      case "gif": return "image/gif";
      case "png": return "image/png";
      case "svg": return "image/svg+xml";
      default: return server.isTextFile(filename) ? "text/plain" : "application/octet-stream";
    }
  };

  server.serveStaticFile = (route, fullPath) => {
    server.addRoute(route, "GET", (req, res) => {
      res.setHeader("Content-Type", server.getMimeType(fullPath));
      let stream;
      try {
        stream = fs.createReadStream(fullPath);
      } catch (e) {
        res.writeHead(404);
        return res.end("");
      }
      res.writeHead(200);
      return stream.pipe(res);
    });
  };

  server.serveStatic = (baseRoute, baseFilePath) => {
    // Remove trailing slashes from baseRoute
    const trailingSlashRegExp = /(^\/+|\/+$)/g;
    baseRoute = baseRoute.replace(trailingSlashRegExp, "");

    let filePaths = server.findChildPaths(baseFilePath);
    // Trim out the prepended baseFilePath
    filePaths = filePaths.map(i => i.substring(baseFilePath.length).replace(trailingSlashRegExp, ""));

    let route, filePath;
    filePaths.forEach(i => {
      route = `${baseRoute}/${i}`;
      filePath = path.join(baseFilePath, i);
      server.serveStaticFile(route, filePath);
    });
  };

  return server;
}



module.exports = Srvr;