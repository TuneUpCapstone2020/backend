const express = require('express')
const vehicleController = require('../controllers/vehicleController')

const router = express.Router()

//Create
router.post('/create', vehicleController.vehicle_post)

//Retrieve
router.get('/', vehicleController.vehicle_get_all)
router.get('/client', vehicleController.vehicle_get_all_of_client)
router.get('/license', vehicleController.vehicle_get_by_licence)
router.get('/attributes',vehicleController.vehicle_get_health_attributes_by_vehicle_id)
router.get('/id', vehicleController.vehicle_get_vehicle_id_by_appointment_id)

//Update
router.put('/', vehicleController.vehicle_update)

//Delete
router.delete('/', vehicleController.vehicle_delete)

module.exports = router