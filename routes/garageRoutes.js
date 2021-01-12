const express = require('express')
const garageController = require('../controllers/garageController')

const router = express.Router()

router.get('/', garageController.garage_index)

router.post('/', garageController.garage_create_garage)

module.exports = router