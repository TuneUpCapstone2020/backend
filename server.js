'use strict'

const express = require('express') //nodejs framework. check it out at: https://expressjs.com/
const mongoose = require('mongoose') //helps with database. Check it out at: https://mongoosejs.com/
const cookieParser = require('cookie-parser')
const util = require('util')
const employeeRoutes = require('./routes/employeeRoutes')
const clientRoutes = require('./routes/clientRoutes')
const vehicleRoutes = require('./routes/vehicleRoutes')
const appointmentRoutes = require('./routes/appointmentRoutes')
const garageRoutes = require('./routes/garageRoutes')
const catalogRoutes = require('./routes/catalogRoutes')
const packageRoutes = require('./routes/packageRoutes')
const makeAndModelRoutes = require('./routes/vehicleMakeAndModelRoutes')
const imageStorageRoutes = require('./routes/imageStorageRoutes')
const valetRouteRoutes = require('./routes/valetRouteRoutes')
const billingRoutes = require('./routes/billingRoutes')
// const pushNotificationRoutes = require('./routes/pushNotificationRoutes')
const helpers = require('./helpers')

const { requireAuth, checkClient } = require('./middleware/clientMiddleware')

require('dotenv').config() //makes process.env access the .env file which allows us to do provess.env.DB_PASS

// Constants
const LOCAL_PORT = process.env.LOCALPORT
const LOCAL_HOST = process.env.LOCALHOST
const CLOUD_HOST = process.env.CLOUD_HOST
const CLOUD_PORT = process.env.CLOUD_PORT
const ALLOWED_LISTEN = process.env.ALLOWED_LISTEN

//express app
const app = express()
//socket.io setup
const server = require('http').createServer(app)
const io = require('socket.io')(server, {
  path: '/gps/socket.io',
  // path: '/socket.io',
})
const ioClient = require('socket.io-client')
//server.listen(3001, LOCAL_HOST)
//io.listen(server)

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

//0 for local deploy, 1 for cloud
if (process.env.NODE_LOCAL_DEPLOY == 1) {
  //This is to connect to the atlast version of the DB.
  const dbURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@tuneup-dev.pcwc5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  mongoose
    .connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      //Print some db connection info
      console.log(
        `Successfully conencted to the ${process.env.DB_NAME} database`
      )
      server.listen(CLOUD_PORT, ALLOWED_LISTEN, () => {
        //io.listen(server)
        console.log(`Running on http://${CLOUD_HOST}:${CLOUD_PORT}`)
      })

      //check if default list of vehicles exists. If not, add it.
      mongoose.connection.db.listCollections().toArray(function (err, names) {
        if (err) {
          console.log(err.message)
        } else {
          //console.log(`Collections: ${JSON.stringify(names, null, 2)}`)
          let vehiclesExist = false
          for (let i = 0; i < names.length; i++) {
            if (names[i]['name'].includes('vehiclemakes')) {
              console.log(`Vehilce Makes and models already exists.`)
              vehiclesExist = true
              break
            }
          }
          if (!vehiclesExist) {
            helpers.populateVehicles()
          }
        }

        //mongoose.connection.close()
      })
    })
    .catch((err) => {
      console.warn(`Unable to connect to ${process.env.DB_NAME}}`)
      console.log(`Error: ${err.message}`)
    })
} else {
  //url format should follow: 'mongodb://localhost:27017/your_database_name', we might need to add DB name as well
  const connection = mongoose
    .connect(`mongodb://mongo:27017`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      user: 'root',
      pass: 'root',
    })
    .then(() => {
      //log connection
      console.log(
        `Successfully connected to the ${process.env.DB_NAME_LOCAL} database`
      )
      //app.listen(LOCAL_PORT, LOCAL_HOST)
      server.listen(LOCAL_PORT, LOCAL_HOST, () => {
        //io.listen(server)
        console.log(`Running on http://${LOCAL_HOST}:${LOCAL_PORT}`)
      })

      //check if default list of vehicles exists. If not, add it.
      mongoose.connection.db.listCollections().toArray(function (err, names) {
        if (err) {
          console.log(err.message)
        } else {
          //console.log(`Collections: ${JSON.stringify(names, null, 2)}`)
          let vehiclesExist = false
          for (let i = 0; i < names.length; i++) {
            //console.log(`name${i}: ${JSON.stringify(names[i])}`)
            if (names[i]['name'].includes('vehiclemakes')) {
              console.log(`Vehicle Makes and models already exists.`)
              vehiclesExist = true
              break
            }
          }
          if (!vehiclesExist) {
            helpers.populateVehicles()
          }
        }

        //mongoose.connection.close()
      })
    })
    .catch((err) => {
      throw err
    })
}
mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

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

//package routes
app.use('/api/package', packageRoutes)

//makeAndModel routes
app.use('/api/makeandmodel', makeAndModelRoutes)

//image routes
app.use('/api/image', imageStorageRoutes)

//valetRoutes
app.use('/api/valet', valetRouteRoutes)

//billing routes
app.use('/api/billing', billingRoutes)

//pushNotificationRoutes
//app.use('/api/notification', pushNotificationRoutes)

//apply to every route
app.get('*', checkClient)

// Home Page
app.get('/', (req, res) => {
  res.send(
    'Welcome to TuneUp! Our Groups 2021 Capstone project. See the github link when it becomes public!'
  )
})

//easy postman tests
app.get('/ping/', (req, res) => {
  res.send('PONG')
})

//test api route
app.get('/api/', (req, res) => {
  res.send('You have reached the api of this server')
})

//get current server time
app.get('/today', (req, res) => {
  const date = new Date()
  res.status(200).json({
    date: date,
    dateMinute: date.getMinutes(),
    dateMinuteUTC: date.getUTCMinutes(),
  })
})

//test socket.io
// app.get('/gps/socket.io', (req, res) => {
//   // const socket = ioClient('http://0.0.0.0:3001', {
//   //   path: '/gps/socket.io',
//   // })
//   // //const socket = io.connect('http://0.0.0.0:3000')
//   // socket.on('hello', (args) => {
//   //   console.log(`args: ${args}`)
//   //   console.log('Sent hello!')
//   // })
//   // socket.on('connect', (args) => {
//   //   console.log(`connected:${socket.connected}`)
//   //   res.send(socket.connected)
//   // })
//   //console.log(socket)
//   //res.send(`testing socket:\n ${util.inspect(socket, { depth: null })}`)
//   res.send(`hello`)
// })

io.on('connection', (socket) => {
  console.log(`User with socketId ${socket.id} has connected!`)

  socket.on('joinLiveLocationRoom', (appointmentId) => {
    console.log(`socket ${socket.id} just joined room ${appointmentId}`)
    socket.join(appointmentId)
  })
  socket.on('newValetLocation', (message) => {
    message = JSON.parse(message)
    socket.to(message.room).emit('newLocationForClient', {
      latLng: message.latLng,
      bearing: message.bearing,
    })
  })

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})
