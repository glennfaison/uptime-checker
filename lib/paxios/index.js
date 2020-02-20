const _http = require("http");
const _https = require("https");
const _url = require("url");
const _qs = require("querystring");



const paxios = {};



paxios.objectToQueryString = (obj) => {
  let validEntries = Object.entries(obj).filter(i => typeof (i[1]) !== "object");
  validEntries = validEntries.map(i => `${encodeURIComponent(i[0])}=${encodeURIComponent(i[1])}`);
  return validEntries.join("&");
}

paxios.queryStringToObject = (qs) => {
  if (!qs) { return {}; }
  qs = decodeURIComponent(qs)
  const entries = qs.split("&").map(i => i.split("="));
  return Object.fromEntries(entries);
}

paxios.getQueryFromUrl = (url) => {
  let match = url.match(/\?(.*)/);
  return match ? match[1] : "";
}

function _createRequest(method, url, query, body, headers, callback) {
  // Attempt to validate arguments
  method = typeof (method) === "string" ? method.toUpperCase() : "GET";
  url = typeof (url) === "string" ? url : "/";
  query = typeof (query) === "object" && !!query ? query : {};
  body = typeof (body) === "object" && !!body ? body : {};
  headers = typeof (headers) === "object" && !!headers ? headers : {};

  // Merge any existing query from `url`, with `queryParams`
  let queryInUrl = paxios.queryStringToObject(paxios.getQueryFromUrl(url));
  let newQueryParams = { ...queryInUrl, ...query };

  // remove query from `url` and reconstruct url
  const newUrl = `${url.replace(/\?.*/, "")}?${paxios.objectToQueryString(newQueryParams)}`;

  // The parsed url contains all the information needed for our request's options parameter
  let requestOptions = _url.parse(newUrl, true);
  requestOptions.headers = {
    "Content-Type": "application/vnd.api+json",
    ...requestOptions.headers,
  };

  let protocol = requestOptions.protocol === "https:" ? _https : _http;

  const req = protocol.request(requestOptions, (res) => {
    let chunks = [];

    res.on("error", e => {
      callback({ error: e, statusCode: res.statusCode, statusMessage: res.statusMessage });
    });

    res.on("data", chunk => {
      chunks.push(chunk);
    });

    res.on("end", () => {
      let responseBody = Buffer.concat(chunks).toString("utf-8");
      try {
        responseBody = JSON.parse(responseBody);
      } catch (e) {}
      callback({ data: responseBody, statusCode: res.statusCode, statusMessage: res.statusMessage });
    });
  });

  if (method !== "GET") {
    req.write(_qs.stringify(body));
  }
  req.end();
}

paxios.createRequest = async (method, url, query, body, headers) => {
  return new Promise((resolve, reject) => {
    _createRequest(method, url, query, body, headers, (res) => {
      if (res.error) { reject(res); }
      else { resolve(res); }
    });
  });
}

paxios.get = async (url, query, headers) => {
  return await paxios.createRequest("GET", url, query, {}, headers);
}

paxios.post = async (url, query, body, headers) => {
  return await paxios.createRequest("POST", url, query, body, headers);
}

paxios.put = async (url, query, body, headers) => {
  return await paxios.createRequest("PUT", url, query, body, headers);
}

paxios.del = async (url, query, body, headers) => {
  return await paxios.createRequest("DELETE", url, query, body, headers);
}



module.exports = paxios;