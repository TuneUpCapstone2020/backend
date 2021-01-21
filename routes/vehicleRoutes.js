const express = require('express')
const vehicleController = require('../controllers/vehicleController')

const router = express.Router()

router.get('/', vehicleController.vehicle_get)

router.post('/create', vehicleController.vehicle_post)

module.exports = router