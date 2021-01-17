const express = require('express')
const itemController = require('../controllers/itemController')

const router = express.Router()

router.get('/', itemController.item_index)

router.post('/', itemController.item_create_item)

module.exports = router