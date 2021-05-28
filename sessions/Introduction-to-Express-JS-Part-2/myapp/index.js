const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbpath = path.join(__dirname, "goodreads.db");
app.listen(3000, () => {
  console.log("server started running at https://localhost:3000");
});
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbAndServer();

app.get("/books/", async (request, response) => {
  const squliteQuery = `SELECT * FROM book ORDER BY book_id;`;
  const result = await db.all(squliteQuery);
  response.send(result);
});
