const express = require('express')
const employeeController = require('../controllers/employeeController')
const { route } = require('./clientRoutes')

const router = express.Router()

//Create
router.post('/create', employeeController.employee_create)
router.post('/login', employeeController.employee_login)

//Retrieve
router.get('/', employeeController.employee_get_all)
router.get('/last_name', employeeController.employee_get_by_last_name)
router.get('/employee_number', employeeController.employee_get_by_employee_number)
router.get('/phone_number', employeeController.employee_get_by_phone_number)
router.get('/skill_level', employeeController.employee_get_by_skill_level)
router.get('/logout', employeeController.employee_logout)

//Update
router.put('/', employeeController.employee_update)

//Delete
router.delete('/', employeeController.employee_delete)

module.exports = router