const express = require('express')
const clientController = require('../controllers/clientController')

const router = express.Router()

router.get('/register', clientController.register_get)
router.post('/register', clientController.register_post)
router.get('/login', clientController.login_get)
router.post('/login', clientController.login_post)
router.get('/logout', clientController.logout_get)

module.exports = router