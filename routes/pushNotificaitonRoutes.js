const express = require('express')
const pushNotificationController = require('../controllers/pushNotificationController')
const router = express.Router()

//Create
router.post('/', pushNotificationController.send_push_notification)
