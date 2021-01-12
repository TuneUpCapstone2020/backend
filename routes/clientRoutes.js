const express = require('express')
const clientController = require('../controllers/clientController')

const router = express.Router()

router.get('/', clientController.client_index)

router.post('/', clientController.client_create_client)

module.exports = router