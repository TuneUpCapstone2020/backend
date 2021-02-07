const express = require('express')
const packageController = require('../controllers/packageController')
const router = express.Router()

//Create
router.post('/', packageController.package_create)
//Retrieve
router.get('/', packageController.package_get_all)
router.get('/publish', packageController.package_get_all_published)
router.get('/unpublished', packageController.package_get_all_unpublished)
router.get('/garage', packageController.package_get_by_garage)
router.get('/name', packageController.package_get_by_name)
//Update
router.put('/', packageController.package_update)
router.put('/publish', packageController.package_publish_or_unpublish)
//Delete
router.delete('/', packageController.package_delete)

module.exports = router
