const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
let db = null;
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
app.use(express.json());

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initialize();

function authenticateUser(request, response, next) {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
}

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const queryGet = `select * from user where username='${username}'`;
  const result = await db.get(queryGet);
  if (result === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isCorrectPassword = await bcrypt.compare(password, result.password);
    if (isCorrectPassword) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

const printState = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

const printDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
app.get("/states/", authenticateUser, async (request, response) => {
  const query = `select * from state`;
  const result = await db.all(query);
  const myArray = result.map((eachState) => printState(eachState));
  response.send(myArray);
});

app.get("/states/:stateId/", authenticateUser, async (request, response) => {
  const { stateId } = request.params;
  const query = `select * from state where state_id=${stateId}`;
  const result = await db.get(query);
  response.send(printState(result));
});

app.post("/districts/", authenticateUser, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query = `insert into district(district_name,state_id,cases,cured,active,deaths)
      values('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  await db.run(query);
  response.send("District Successfully Added");
});

app.get(
  "/districts/:districtId/",
  authenticateUser,
  async (request, response) => {
    const { districtId } = request.params;
    const query = `select * from district where district_id=${districtId}`;
    const result = await db.get(query);
    response.send(printDistrict(result));
  }
);

app.delete(
  "/districts/:districtId/",
  authenticateUser,
  async (request, response) => {
    const { districtId } = request.params;
    const query = `delete from district where district_id=${districtId}`;
    await db.run(query);
    response.send("District Removed");
  }
);

app.put(
  "/districts/:districtId/",
  authenticateUser,
  async (request, response) => {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const query = `update district set district_name='${districtName}',
    state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths}`;
    await db.run(query);
    response.send("District Details Updated");
  }
);

app.get(
  "/states/:stateId/stats/",
  authenticateUser,
  async (request, response) => {
    const { stateId } = request.params;
    const query = `select sum(cases),sum(cured),sum(active),sum(deaths) from district where state_id=${stateId}`;
    const result = await db.get(query);
    response.send({
      totalCases: result["sum(cases)"],
      totalCured: result["sum(cured)"],
      totalActive: result["sum(active)"],
      totalDeaths: result["sum(deaths)"],
    });
  }
);

module.exports = app;
