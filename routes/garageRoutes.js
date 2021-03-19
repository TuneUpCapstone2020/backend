const express = require('express')
const garageController = require('../controllers/garageController')

const router = express.Router()

//Create
router.post('/create', garageController.garage_create)
router.post('/valet', garageController.garage_complete_item_from_valet_queue)

//Retreive
router.get('/', garageController.garage_get_all)
router.get('/name', garageController.garage_get_by_name)
router.get('/owner', garageController.garage_get_by_owner)
router.get('/valet', garageController.garage_get_valet_queue_first_item)

module.exports = router
