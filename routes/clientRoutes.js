const express = require('express')
const clientController = require('../controllers/clientController')

const router = express.Router()

//Create
router.post('/register', clientController.register_post)
router.post('/login', clientController.login_post)
router.post('/profile_picture', clientController.upload_profile_pic_url)

//Retrieve
router.get('/', clientController.client_get_all)
router.get('/full_name', clientController.client_get_by_full_name)
router.get('/phone_number', clientController.client_get_by_phone_number)
router.get('/logout', clientController.logout_get)

//Update
router.put('/', clientController.client_update)

//Delete
router.delete('/', clientController.client_delete)

module.exports = router
