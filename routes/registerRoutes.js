const express = require('express')
const registerController = require('../controllers/registerController')

const router = express.Router()

router.get('/', registerController.client_index)

router.post('/', registerController.client_create_client)

module.exports = router