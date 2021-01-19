const Vehicle = require('../models/vehicle')
const Client = require('../models/client')
const jwt = require('jsonwebtoken')

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code)
  let errors = {
    make: '',
    model: '',
    nickName: '',
    license: '',
    year: '',
    mileage: '',
    vinNumber: ''
  }

  //validation errors
  if (err.message.includes('Vehicle validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message
    })
  }

  return errors

}

const vehicle_get = (req, res) => {
  Vehicle.find().sort({ createdAt: -1 })
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      throw err
    })
}

const vehicle_post = async (req, res) => {
  const { make, model, nickName, license, year, mileage, vinNumber } = req.body
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  // Remove Bearer from string
  token = token.replace(/^Bearer\s+/, "");
  const decodedId = jwt.decode(token, 'tuneup secret')


  try {
    const vehicle = await Vehicle.create({ make, model, nickName, license, year, mileage, vinNumber })
    await Client.addVehicle(decodedId.id, vehicle)
    res.status(201).json({ vehicle: vehicle._id })

  } catch (err) {
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

module.exports = {
  vehicle_get,
  vehicle_post
}