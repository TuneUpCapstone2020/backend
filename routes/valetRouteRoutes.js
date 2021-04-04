const express = require('express')
const valetRouteController = require('../controllers/valetRouteController')
const { route } = require('./vehicleRoutes')
const router = express.Router()

//Create
router.post('/', valetRouteController.route_create)

//Retrieve
router.get('/', valetRouteController.route_get_coordinates_by_route_id)
router.get('/appointment', valetRouteController.route_get_coordinates_by_appointment_id)
router.get('/address', valetRouteController.route_get_lat_and_long_from_address)

//Update
router.put('/', valetRouteController.route_add_point_by_appointment_id)
router.put('/complete', valetRouteController.route_end_valet_trip_by_appointment_id)

module.exports = router
