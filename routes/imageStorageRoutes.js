const express = require('express')
const router = express.Router()
const imageStorageController = require('../controllers/imageStorageController')
const { modelName } = require('../models/catalogService')

//Create
router.post('/', imageStorageController.image_upload)
//Retrieve
router.get('/', imageStorageController.image_download)

module.exports = router
