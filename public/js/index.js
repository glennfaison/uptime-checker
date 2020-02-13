import * as httptart from "./httptart.js";



httptart.get(
  "http://localhost:3000/ping/3?name=glenn",
  {},
  { "Content-Type": "application/json", }
).then(data => console.log("data:", data));