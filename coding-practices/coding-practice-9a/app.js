const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
let database = null;
const initialize = async () => {
  try {
    database = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server started");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initialize();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const queryRegistered = `select * from user where username="${username}"`;
  const dbUser = await database.get(queryRegistered);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (dbUser === undefined) {
    const queryCreateUser = `insert into user(username, name, password, gender, location) values ('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
    await database.run(queryCreateUser);
    response.status(200);
    response.send("User created successfully");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const queryRegistered = `select * from user where username="${username}"`;
  const dbUser = await database.get(queryRegistered);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `select * from user where username='${username}'`;
  const dbUser = await database.get(userQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);

  if (isPasswordMatched === false) {
    response.status(400);
    response.send("Invalid current password");
  } else if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (isPasswordMatched) {
    const hashedPassword = await bcrypt.hash(request.body.newPassword, 10);
    const queryUpdate = `update user set password="${hashedPassword}" where username="${username}"`;
    await database.run(queryUpdate);
    response.status(200);
    response.send("Password updated");
  }
});
module.exports = app;
