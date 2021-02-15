const express = require('express')
const vehicleMakeAndModelController = require('../controllers/vehicleMakeAndModelController')
const router = express.Router()

//create - none required
//Retrieve
router.get('/make', vehicleMakeAndModelController.vehicle_make_get_all)
router.get('/all', vehicleMakeAndModelController.vehicle_models_get_all)
router.get(
  '/model',
  vehicleMakeAndModelController.vehicle_models_get_by_make_id
)
//Update - none required
//Delete - none required
