const express = require('express')
const clientController = require('../controllers/clientController')

const router = express.Router()

router.get('/register_client', clientController.register_get)
router.post('/register_client', clientController.register_post)
router.get('/login_client', clientController.login_get)
router.post('/login_client', clientController.login_post)

module.exports = router