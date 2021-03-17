const express = require('express')
const router = express.Router()
const imageStorageController = require('../controllers/imageStorageController')
const { modelName } = require('../models/catalogService')

//Create
router.post('/', imageStorageController.image_upload)
router.post('/inspection', imageStorageController.image_upload_inspection_image)
router.post('/logo', imageStorageController.image_upload_make_logo)

//Retrieve
router.get('/', imageStorageController.image_download)

module.exports = router
