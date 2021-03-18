const express = require('express')
const billingController = require('../controllers/billingController')
const router = express.Router()

//Retrieve
router.get('/', billingController.generate_all_bills_for_client)
router.get('/bill_detail', billingController.generate_appointment_cost_breakdown)


module.exports = router