const express = require('express')
const appointmentController = require('../controllers/appointmentController')

const router = express.Router()

router.get('/', appointmentController.appointment_index)

router.post('/', appointmentController.appointment_create_appointment)

module.exports = router