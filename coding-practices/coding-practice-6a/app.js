const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "covid19India.db");
const initialize = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server started");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initialize();

const printState = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

const printDistrict = (eachDistrict) => {
  return {
    districtId: eachDistrict.district_id,
    districtName: eachDistrict.district_name,
    stateId: eachDistrict.state_id,
    cases: eachDistrict.cases,
    cured: eachDistrict.cured,
    active: eachDistrict.active,
    deaths: eachDistrict.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const queryGet = `select * from state`;
  const result = await db.all(queryGet);
  const myArray = result.map((eachState) => printState(eachState));
  response.send(myArray);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const queryGet = `select * from state where state_id=${stateId}`;
  const result = await db.get(queryGet);
  response.send(printState(result));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const queryPost = `insert into district (district_name,state_id,cases,cured,active,deaths) 
    values('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  await db.run(queryPost);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const queryGet = `select * from district where district_id=${districtId}`;
  const result = await db.get(queryGet);
  response.send(printDistrict(result));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const queryDelete = `delete from district where district_id=${districtId}`;
  await db.run(queryDelete);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const queryPost = `update district set district_name='${districtName}',state_id=${stateId},
    cases=${cases},cured=${cured},active=${active},deaths=${deaths} where district_id=${districtId}`;
  await db.run(queryPost);
  response.send("District Details Updated");
});


app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const queryGet = `SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const result = await db.get(queryGet);
  response.send({
    totalCases: result["SUM(cases)"],
    totalCured: result["SUM(cured)"],
    totalActive: result["SUM(active)"],
    totalDeaths: result["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const queryGet = `select state_name from state natural join district where district_id=${districtId}`;
  const result = await db.get(queryGet);
  response.send({ stateName: result.state_name });
});

module.exports = app;
