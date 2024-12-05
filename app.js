const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'covid19India.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`
  const statesArray = await database.all(getStatesQuery)
  response.send(
    statesArray.map(eachState =>
      convertStateDbObjectToResponseObject(eachState),
    ),
  )
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT 
      *
    FROM 
      state 
    WHERE 
      state_id = ${stateId};`
  const state = await database.get(getStateQuery)
  response.send(convertStateDbObjectToResponseObject(state))
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictsQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`
  const district = await database.get(getDistrictsQuery)
  response.send(convertDistrictDbObjectToResponseObject(district))
})

app.post('/districts/', async (request, response) => {
  const {stateId, districtName, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`
  await database.run(postDistrictQuery)
  response.send('District Successfully Added')
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId} 
  `
  await database.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `

  await database.run(updateDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`
  const stats = await database.get(getStateStatsQuery)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`
  const state = await database.get(getStateNameQuery)
  response.send({stateName: state.state_name})
})

module.exports = app






























// const express = require('express')
// const app = express()
// const {open} = require('sqlite')
// const sqlite3 = require('sqlite3')
// app.use(express.json())
// const path = require('path')
// const dbPath = path.join(__dirname, 'covid19India.db')

// let db = null
// const incializeDbAndServer = async () => {
//   try {
//     db = await open({
//       filename: dbPath,
//       driver: sqlite3.Database,
//     })
//     app.listen(3000, () => {
//       console.log('server started')
//     })
//   } catch (e) {
//     console.log(`DB error ${e.message}`)
//     process.exit(1)
//   }
// }
// incializeDbAndServer()

// // convert snakeCase to cameleCase
// function convertSnakeCaseToCameleCase(dbObject) {
//   return {
//     stateId: dbObject.state_id,
//     stateName: dbObject.state_name,
//     population: dbObject.population,
//   }
// }

// // Returns a list of all states in the state table API 1
// app.get('/states/', async (request, response) => {
//   const getALLStatesQuery = `SELECT * FROM state`
//   const allStates = await db.all(getALLStatesQuery)
//   response.send(
//     allStates.map(eachState => convertSnakeCaseToCameleCase(eachState)),
//   )
//   console.log(typeof allStates)
// })

// // Returns a state based on the state ID API 2
// app.get('/states/:stateId/', async (request, response) => {
//   const {stateId} = request.params
//   const getStateQuery = `SELECT * FROM state WHERE state_id=${stateId}`
//   const stateApi = await db.get(getStateQuery)
//   response.send(convertSnakeCaseToCameleCase(stateApi))
//   console.log(typeof stateApi)
// })

// // Create a district in the district table, district_id is auto-incremented API 3
// app.post('/districts/', async (request, response) => {
//   const districtsNames = request.body
//   const {districtName, stateId, cases, cured, active, deaths} = districtsNames

//   const createDistictsQuery = `INSERT INTO district (district_name,state_id,cases,cured
//    ,active,deaths) VALUES('${districtName}', ${stateId},${cases},${cured},
//    ${active},${deaths})`
//   const postApi = await db.run(createDistictsQuery)
//   const {districtId} = postApi.lastID
//   response.send('District Successfully Added')
// })

// //Returns a district based on the district ID APi 4
// app.get('/districts/:districtId/', async (request, response) => {
//   const {districtId} = request.params
//   const getQuery = `SELECT * FROM district WHERE district_id = ${districtId}`
//   console.log(getQuery)
//   const distict = await db.get(getQuery)
//   console.log(distict)
//   response.send({
//     districtId: distict.district_id,
//     districtName: distict.district_name,
//     stateId: distict.state_id,
//     cases: distict.cases,
//     cured: distict.cured,
//     active: distict.active,
//     deaths: distict.deaths,
//   })
// })

// // Deletes a district from the district table based on the district ID API 5
// app.delete('/districts/:districtId/', async (request, response) => {
//   const {districtId} = request.params
//   const deleteDistictNameQuery = `DELETE FROM district WHERE district_id=${districtId}`
//   await db.run(deleteDistictNameQuery)
//   response.send('District Removed')
// })

// // Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID API 6
// app.put('/districts/:districtId/', async (request, response) => {
//   const {districtId} = request.params
//   const distictNameDetails = request.body
//   const {districtName, stateId, cases, cured, active, deaths} =
//     distictNameDetails
//   const distictNameQuery = `UPDATE district 
//   SET 
//   district_name='${districtName}', 
//   state_id = ${stateId},
//    cases = ${cases},
//    cured = ${cured},
//    active = ${active},
//   deaths = ${deaths}
//    WHERE district_id=${districtId}`
//   const dbquery = await db.run(distictNameQuery)
//   console.log(dbquery)
//   response.send('District Details Updated')
// })

// // Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID API 7
// app.get('/states/:stateId/stats/', async (request, response) => {
//   const {stateId} = request.params
//   const getStateIdStatsQuery = `SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths)
//   FROM district WHERE state_id = ${stateId}`
//   const stats = await db.get(getStateIdStatsQuery)
//   console.log(stats)
//   response.send({
//     totalCases: stats['SUM(cases)'],
//     totalCured: stats['SUM(cured)'],
//     totalActive: stats['SUM(active)'],
//     totalDeaths: stats['SUM(deaths)'],
//   })
//   // response.send('hiii subbu')
// })

// // Returns an object containing the state name of a district based on the district ID API 8
// // app.get('/districts/:districtId/details/', async (request, response)=>{

// app.get('/districts/:districtId/details/', async (request, response) => {
//   const {districtId} = request.params
//   const getDistrictIdQuery = `
//     select state_id from district
//     where district_id = ${districtId};
//     ` //With this we will get the state_id using district table
//   const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)
//   console.log(getDistrictIdQueryResponse)
//   const getStateNameQuery = `
//     select state_name as stateName from state
//     where state_id = ${getDistrictIdQueryResponse.state_id};
//     ` //With this we will get state_name as stateName using the state_id
//   const getStateNameQueryResponse = await db.get(getStateNameQuery)
//   console.log(getStateNameQueryResponse)
//   response.send(getStateNameQueryResponse)
// }) //sending the required response

// module.exports = app
