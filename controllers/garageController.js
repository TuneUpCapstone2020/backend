const Garage = require('../models/garage')

const garage_index = (req, res) => {
  Garage.find()
    .sort({ createdAt: -1 })
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      throw err
    })
}

const garage_create_garage = (req, res) => {
  //console.log(req.body)
  //const garage = new Garage(req.body)
  const garage = new Garage({
    name: "Joe's Garage",
    owner: 'Joe Blow',
    email: 'joe@joesgarage.com',
    phoneNum: '514-555-6969',
    address: '420 Fixit Ave.',
    standard_hourly_rate: '10000',
    appointment_capacity: '15',
    opening_time: '480',
    closing_time: '960',
  })

  garage
    .save()
    .then((result) => {
      //res.redirect('/client')
      res.status(201).json({
        message: 'New garage created!',
        Garage: result._id,
      })
    })
    .catch((err) => {
      res.status(400).json({
        message: 'Unable to create new garage',
        error: err.message,
      })
    })
}

module.exports = {
  garage_index,
  garage_create_garage,
}
