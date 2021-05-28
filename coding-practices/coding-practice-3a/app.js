const addDays = require("date-fns/addDays");
const express = require("express");
const app = express();
app.get("/", (request, response) => {
  let daysEl = addDays(new Date(), 100);
  daysEl = `${daysEl.getDate()}/${
    daysEl.getMonth() + 1
  }/${daysEl.getFullYear()}`;
  response.send(daysEl);
});
app.listen(3000);
module.exports = app;
