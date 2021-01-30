'use strict'

const express = require('express') //nodejs framework. check it out at: https://expressjs.com/
const mongoose = require('mongoose') //helps with database. Check it out at: https://mongoosejs.com/
const cookieParser = require('cookie-parser')
const employeeRoutes = require('./routes/employeeRoutes')
const clientRoutes = require('./routes/clientRoutes')
const vehicleRoutes = require('./routes/vehicleRoutes')
const appointmentRoutes = require('./routes/appointmentRoutes')
const garageRoutes = require('./routes/garageRoutes')
const catalogRoutes = require('./routes/catalogRoutes')

const { requireAuth, checkClient } = require('./middleware/clientMiddleware')

require('dotenv').config() //makes process.env access the .env file which allows us to do provess.env.DB_PASS

//express app
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

//when its time to connect to the db, we're going to use something like: (except for either atlas or local depending on where its being deployed)
//mongoose.connect(`mongodb://${process.env.DB_NAME}:${process.env.DB_PASS}@ds241658.mlab.com:41658/test_db`,(err)=>{
//  if(err) throw err;
//  console.log("DB Connected Successfully");
//})

//format for atlas db
//mongodb+srv://capstoneDev:<password>@tuneup-dev.pcwc5.mongodb.net/<dbname>?retryWrites=true&w=majority
//store db values needed for connection

//This is to connect to the atlast version of the DB. TODO: Figure out a way to properly handle the env vars and setup the connection
const dbURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@tuneup-dev.pcwc5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
// mongoose.connect(dbURI,
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   }).then(() => {
//     console.log(`Successfully conencted to the ${process.env.DB_NAME} database`)
//     app.listen(PORT, HOST)
//     console.log(`Running on http://${HOST}:${PORT}`)
//   }).catch((err) => {
//     console.log('cant connect')
//     throw err;
//   });

//url format should follow: 'mongodb://localhost:27017/your_database_name', we might need to add DB name as well
mongoose.Promise = global.Promise
mongoose
  .connect(`mongodb://mongo:27017`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    user: 'root',
    pass: 'root',
  })
  .then(() => {
    console.log(
      `Successfully connected to the ${process.env.DB_NAME_LOCAL} database`
    )
    app.listen(PORT, HOST)
    console.log(`Running on http://${HOST}:${PORT}`)
  })
  .catch((err) => {
    throw err
  })
mongoose.set('useFindAndModify', false)

// Constants
const PORT = process.env.LOCALPORT
const HOST = process.env.LOCALHOST

//appointment routes

app.use('/api/appointment', appointmentRoutes)

//client routes
app.use('/api/client', clientRoutes)

//employee routes
app.use('/api/employee', employeeRoutes)

//garage routes
app.use('/api/garage', garageRoutes)

//vehicle routes
app.use('/api/vehicle', vehicleRoutes)

//catalog routes
app.use('/api/catalog', catalogRoutes)

//apply to every route
app.get('*', checkClient)

// Home Page
app.get('/', (req, res) => {
  res.send('Hello World')
})

//easy postman test
app.get('/ping/', (req, res) => {
  res.send('PONG')
})

app.get('/api/', (req, res) => {
  res.send('You have reached the api of this server')
})

app.get('/today', (req, res) => {
  const date = new Date()
  res.status(200).json({
    date: date,
    dateMinute: date.getMinutes(),
    dateMinuteUTC: date.getUTCMinutes(),
  })
})
