const express = require('express')
const valetRouteController = require('../controllers/valetRouteController')
const { route } = require('./vehicleRoutes')
const router = express.Router()

//Create
router.post('/', valetRouteController.route_create)

//Retrieve
router.get('/', valetRouteController.route_get_coordinates_by_route_id)
router.get('/appointment', valetRouteController.route_get_coordinates_by_appointment_id)

//Update
router.put('/', valetRouteController.route_add_point_by_appointment_id)







module.exports = router
