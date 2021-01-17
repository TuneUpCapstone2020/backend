const express = require('express')
const vehicleController = require('../controllers/vehicleController')

const router = express.Router()

router.get('/vehicle', vehicleController.vehicle_get)

router.post('/vehicle', vehicleController.vehicle_post)

module.exports = router