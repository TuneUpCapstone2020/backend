const Vehicle = require('../models/vehicle')

const vehicle_index = (req, res) => {
    Vehicle.find().sort({ createdAt: -1 })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            throw err
        })
}

const vehicle_create_vehicle = (req, res) => {
    //console.log(req.body)
    //const client = new Client(req.body)
    const vehicle = new Vehicle({year: 1993, make: 'Toyota', model: 'Supra'})
  
    vehicle.save()
      .then((result) => {
        res.redirect('/register')
      })
      .catch((err) => {
        throw err
      })
}

module.exports = {
    vehicle_index,
    vehicle_create_vehicle
}