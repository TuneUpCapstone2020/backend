const express = require('express')
const appointmentController = require('../controllers/appointmentController')

const router = express.Router()

//Create
router.post('/', appointmentController.appoints_create)
//Retrieve
router.get('/', appointmentController.appoints_get_all)
router.get('/employee', appointmentController.appoints_get_by_employee)
router.get('/client', appointmentController.appoints_get_by_client)
router.get('/id', appointmentController.appoints_get_one_by_id)
router.get('/date', appointmentController.appoints_get_by_date)
router.get('/date/employee', appointmentController.appoints_get_by_date_and_employee)
router.get('/date/client', appointmentController.appoints_get_by_date_and_client)
router.get('/date/range', appointmentController.appoints_get_by_date_range)
router.get('/date/availability', appointmentController.appoints_get_availability_by_date)
router.get('/date/availability/range', appointmentController.appoints_get_free_days_of_week)
router.get('/archived', appointmentController.archived_appoints_get_all)
router.get('/archived/user', appointmentController.archived_appoints_get_by_user)
router.get('/archived/id', appointmentController.archived_appoints_get_by_id)
//Update
router.put('/', appointmentController.appoints_update)
router.put('/complete', appointmentController.appoints_complete)
router.put('/start', appointmentController.appoints_update_start_time)
//Delete
router.delete('/', appointmentController.appoints_delete)

module.exports = router
