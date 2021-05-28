const express = require("express");
const app = express();
app.get("/", (request, response) => {
  console.log("hello vinutha");
});
app.listen(3000);
