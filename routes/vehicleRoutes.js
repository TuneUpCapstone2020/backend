const express = require('express')
const vehicleController = require('../controllers/vehicleController')

const router = express.Router()

router.get('/', vehicleController.vehicle_index)

router.post('/', vehicleController.vehicle_create_vehicle)

module.exports = router