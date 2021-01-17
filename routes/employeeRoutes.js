const express = require('express')
const employeeController = require('../controllers/employeeController')

const router = express.Router()

router.get('/', employeeController.employee_index)

router.post('/', employeeController.employee_create_employee)

module.exports = router