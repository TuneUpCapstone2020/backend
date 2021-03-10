const Client = require('../models/client')
const helpers = require('../helpers')
const admin = require('firebase-admin')
const gcm = require('node-gcm')
const sender = new gcm.Sender(process.env.FCMServerKey)
const serviceAccount = require('../tuneup-3120a-firebase-adminsdk-l360f-a83c80b9c3.json')
require('dotenv').config()

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  database,
})

/*
 * In query params:
 *  clientId: id of the client the notification needs to be sent to
 * In body:
 *  notificationBody: The body of the notification
 *  notificationTitle: The title of the notification
 */
const send_push_notification = async (req, res) => {
  client = Client.findById(req.query.clientId)
  if (client.devicePlatform === 'android') {
    let message = new gcm.message({
      notification: {
        title: req.body.notificationTitle,
        body: req.body.notificationBody,
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
          res.status(400).json({
            message:
              'Unable to send notification to client! Please contact them directly',
            error: err.message,
          })
        } else {
          console.log(
            `Push notification sent to: 
            \n client: ${client._id} 
            \n device: ${client._id} 
            \n time: ${helpers.getTimeStamp()}
            \n response: ${response}`
          )
          res.status(200).json({
            message: 'Push notification sent to client!',
            client: client._id,
            device: client.deviceId,
            response: response,
          })
        }
      }
    )
  } else if (client.devicePlatform === 'ios') {
    console.warn(
      `Somehow the client has an iPhone even though the app doesn't exist on ios???'`
    )
    res.status(400).json({
      message: 'An error occurred',
      error: 'Client has iPhone without iPhone app existing',
    })
  }
}

module.exports = { send_push_notification }
