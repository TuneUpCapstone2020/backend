const dateFormat = require('dateformat')
const jwt = require('jsonwebtoken')
const VehicleMake = require('./models/vehicleMake')
const VehicleModel = require('./models/vehicleModel')
const Vehicle = require('./models/vehicle')
const { keys } = require('lodash')
require('dotenv').config()

//push notification specific imports
const admin = require('firebase-admin')
const gcm = require('node-gcm')
const sender = new gcm.Sender(process.env.FCMServerKey)
const serviceAccount = require('./tuneup-3120a-firebase-adminsdk-l360f-a83c80b9c3.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const getTimeStamp = () => {
  let date_ob = new Date()
  return dateFormat(date_ob, 'isoDateTime')
}

function getDecodedToken(req) {
  //todo: maybe pass req.headers instead?
  let token = req.headers['x-access-token'] || req.headers['authorization']
  token = token.replace('Bearer ', '')
  token = jwt.decode(token, process.env.JWT_SECRET)
  return token
}

const populateVehicles = () => {
  console.log(`Populating vehicles @ time: ${getTimeStamp()}`)
  //populate collections
  const makes = require('./makes.json')
  const models = require('./models.json')
  VehicleMake.collection.insertMany(makes)
  VehicleModel.collection.insertMany(models)

  //configure indexes
  VehicleMake.syncIndexes()
  VehicleModel.syncIndexes()
  console.log(`Done populating vehicles @ time: ${getTimeStamp()}`)
}

const populateVehicleAttributes = async (vehicleId) => {
  console.log(`Populating vehicle attributes @ time: ${getTimeStamp()}`)
  const vehicle = await Vehicle.findById(vehicleId)
  const attributes = require('./attributes.json')

  for (attribute of attributes) {
    vehicle.health_attributes.push(attribute)
  }
  console.log(`Done populating vehicle attributes @ time: ${getTimeStamp()}`)
}

/*
 * Arguments:
 *  clientId: id of client whom notif is to be sent to
 *  text: the title of the notification
 *  body: the body of the notification
 */
const createPushNotification = async (clientId, title, body) => {
  client = Client.findById(clientId)
  if (client.devicePlatform === 'android') {
    let message = new gcm.message({
      notification: {
        title: title,
        body: body,
        notification: 'notification_important',
      },
    })

    sender.send(
      message,
      {
        registrationTokens: client.deviceId,
      },
      (err, response) => {
        if (err) {
          console.warn(
            `An error occurred in send_push_notification @ time: ${helpers.getTimeStamp()}`
          )
          console.log(`Error: ${err.message}`)
          // res.status(400).json({
          //   message:
          //     'Unable to send notification to client! Please contact them directly',
          //   error: err.message,
          // })
          return {
            message:
              'Unable to send notification to client! Please contact them directly',
            error: err.message,
          }
        } else {
          console.log(
            `Push notification sent to: 
            \n client: ${client._id} 
            \n device: ${client._id} 
            \n time: ${helpers.getTimeStamp()}
            \n response: ${response}`
          )
          return {
            message: 'Push notification sent to client!',
            client: client._id,
            device: client.deviceId,
            response: response,
          }
          // res.status(200).json({
          //   message: 'Push notification sent to client!',
          //   client: client._id,
          //   device: client.deviceId,
          //   response: response,
          // })
        }
      }
    )
  } else if (client.devicePlatform === 'ios') {
    console.warn(
      `Somehow the client has an iPhone even though the app doesn't exist on ios???'`
    )
    return {
      message: 'An error occurred',
      error: 'Client has iPhone without iPhone app existing',
    }
    // res.status(400).json({
    //   message: 'An error occurred',
    //   error: 'Client has iPhone without iPhone app existing',
    // })
  }
}

module.exports = {
  getTimeStamp,
  getDecodedToken,
  populateVehicles,
  populateVehicleAttributes,
  createPushNotification,
}
