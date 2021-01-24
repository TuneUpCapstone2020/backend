const express = require('express')
const catalogController = require('../controllers/catalogController')
const router = express.Router()

//Create
router.post('/product', catalogController.catalog_product_create_new)
router.post('/service', catalogController.catalog_service_create_new)

//Retrieve
router.get('/product', catalogController.catalog_product_get_all)
router.get('/product/name', catalogController.catalog_product_get_by_name)
router.get('/product/product_number', catalogController.catalog_product_get_by_garage_product_number)
router.get('/product/sku', catalogController.catalog_product_get_by_sku)
router.get('/service', catalogController.catalog_service_get_all)
router.get('/service/name', catalogController.catalog_service_get_by_name)
router.get('/service/service_number', catalogController.catalog_service_get_by_service_number)

//Update
router.put('/product', catalogController.catalog_product_update)
router.put('/service', catalogController.catalog_service_update)

//Delete
router.delete('/product', catalogController.catalog_product_delete)
router.delete('/service', catalogController.catalog_service_delete)

module.exports = router