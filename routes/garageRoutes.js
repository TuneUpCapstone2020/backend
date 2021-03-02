const express = require('express')
const garageController = require('../controllers/garageController')

const router = express.Router()

//Create
router.post('/create', garageController.garage_create)

//Retreive
router.get('/', garageController.garage_get_all)
router.get('/name', garageController.garage_get_by_name)
router.get('/owner', garageController.garage_get_by_owner)

module.exports = router