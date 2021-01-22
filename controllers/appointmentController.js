const Appointment = require('../models/appointment')

const appointment_index = (req, res) => {
  Appointment.find().sort({ createdAt: -1 })
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      throw err
    })
}

const appointment_create_appointment = (req, res) => {
  //console.log(req.body)
  //const appointment = new Appointment(req.body)
  const appointment = new Appointment({ date: '2021-04-20', startTime: '4:20 PM', skillLevel: 4, price: 69.99 })

  appointment.save()
    .then((result) => {
      res.redirect('/client')
    })
    .catch((err) => {
      throw err
    })
}

module.exports = {
  appointment_index,
  appointment_create_appointment
}