const express = require('express')
const appointmentController = require('../controllers/appointmentController')

const router = express.Router()

//Create
router.post('/', appointmentController.appoints_create)
router.post('/walk_in', appointmentController.appoints_create_walk_in)
//Retrieve
router.get('/', appointmentController.appoints_get_all)
router.get('/employee', appointmentController.appoints_get_by_employee)
router.get('/employee/nearest', appointmentController.appoints_get_nearest_appoint_by_employee)
router.get('/client', appointmentController.appoints_get_by_client)
router.get('/client/id', appointmentController.appoints_get_by_client_id)
router.get('/id', appointmentController.appoints_get_one_by_id)
router.get('/id/progress', appointmentController.appoints_get_progress_by_id)
router.get('/id/progress/services', appointmentController.appoints_get_appointment_service_progress_by_id)
router.get('/date', appointmentController.appoints_get_by_date)
router.get('/vehicle', appointmentController.appoints_get_by_vehicle)
router.get('/date/employee', appointmentController.appoints_get_by_date_and_employee)
router.get('/date/client', appointmentController.appoints_get_by_date_and_client)
router.get('/date/range', appointmentController.appoints_get_by_date_range)
router.get('/date/status', appointmentController.appoints_get_by_date_and_appoint_status)
router.get('/date/availability', appointmentController.appoints_get_availability_by_date)
router.get('/date/availability/range', appointmentController.appoints_get_free_days_of_week)
router.get('/archived', appointmentController.archived_appoints_get_all)
router.get('/archived/user', appointmentController.archived_appoints_get_by_user)
router.get('/archived/id', appointmentController.archived_appoints_get_by_id)
router.get('/archived/vehicle', appointmentController.archived_appoints_get_by_vehicle)
//Update
router.put('/', appointmentController.appoints_update)
router.put('/complete', appointmentController.appoints_complete)
router.put('/start', appointmentController.appoints_update_start_time)
router.put('/status', appointmentController.appoints_update_status)
router.put('/service', appointmentController.appoints_complete_service)
//Delete
router.delete('/', appointmentController.appoints_delete)

module.exports = router
