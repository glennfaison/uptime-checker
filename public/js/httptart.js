
export function objectToQueryString(obj) {
  let validEntries = Object.entries(obj).filter(i => typeof (i[1]) !== "object");
  validEntries = validEntries.map(i => `${encodeURIComponent(i[0])}=${encodeURIComponent(i[1])}`);
  return validEntries.join("&");
}

export function queryStringToObject(qs) {
  qs = decodeURIComponent(qs)
  const entries = qs.split("&").map(i => i.split("="));
  return Object.fromEntries(entries);
}

export function getQueryFromUrl(url) {
  return url.match(/\?(.*)/)[1];
}

export async function createRequest(method, url, query, body, headers) {
  // Attempt to validate arguments
  method = typeof(method) === "string" ? method : "GET";
  url = typeof(url) === "string" ? url : "/";
  query = typeof(query) === "object" && !!query ? query : {};
  body = typeof(body) === "object" && !!body ? body : {};
  headers = typeof(headers) === "object" && !!headers ? headers : {};

  // Merge any existing query from `url`, with `queryParams`
  let queryInUrl = queryStringToObject(getQueryFromUrl(url));
  let newQueryParams = { ...queryInUrl, ...query };

  // remove query from `url` and reconstruct url
  const newUrl = `${url.replace(/\?.*/, "")}?${objectToQueryString(newQueryParams)}`;

  const xhr = new XMLHttpRequest();
  xhr.open(method.toUpperCase(), newUrl, true);

  // Get entries from `headers` and set them in the request
  let entries = Object.entries(headers);
  entries.forEach(i => xhr.setRequestHeader(i[0], i[1]));

  const response = {};

  xhr.onerror = e => response.error = e;
  xhr.ontimeout = e => response.error = e;
  xhr.onabort = e => response.error = e;

  xhr.onreadystatechange = () => {
    if (xhr.readyState === xhr.DONE) {
      if (xhr.status) {
        response.status = { code: xhr.status, message: xhr.statusText };
      }
      if (xhr.responseText) {
        response.data = JSON.parse(xhr.responseText);
      };
    }

    return response;
  };

  // Send the request
  xhr.send(JSON.stringify(body));
}

export async function get(url, query, headers) {
  return await createRequest("GET", url, query, {}, headers);
}

export async function post(url, query, body, headers) {
  return await createRequest("POST", url, query, body, headers);
}

export async function put(url, query, body, headers) {
  return await createRequest("PUT", url, query, body, headers);
}

export async function del(url, query, body, headers) {
  return await createRequest("DELETE", url, query, body, headers);
}