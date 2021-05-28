const express = require("express");
const app = express();
app.get("/", (request, response) => {
  let dateEl = new Date();
  dateEl = `${dateEl.getDate()}-${
    dateEl.getMonth() + 1
  }-${dateEl.getFullYear()}`;
  response.send(dateEl);
});
app.listen(3000);
module.exports = app;
