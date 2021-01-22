const express = require('express')
const employeeController = require('../controllers/employeeController')

const router = express.Router()

router.get('/', employeeController.employee_get)

router.post('/create', employeeController.employee_post)

module.exports = router