const express = require('express')
const vehicleController = require('../controllers/vehicleController')

const router = express.Router()

//Retrieve
router.get('/', vehicleController.vehicle_get_client)
router.get('/license', vehicleController.vehicle_get_by_licence)

//Create
router.post('/create', vehicleController.vehicle_post)

//Update
router.put('/', vehicleController.vehicle_update)

//Delete
router.delete('/', vehicleController.vehicle_delete)

module.exports = router