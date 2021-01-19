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

const vehicle_get = async (req, res) => {
  let token = getDecodedToken(req)
  const client = await Client.findById(token.id).exec()
  console.log('vehicular devices: ', client.vehicles)
  res.status(200).json(client.vehicles)
}

const vehicle_post = async (req, res) => {
  //TODO: make sure vehicle does not already exist (verify with vin)
  const { make, model, nickName, license, year, mileage, vinNumber } = req.body
  console.log("token before:", token)
  const decodedId = getDecodedToken(req)

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

function getDecodedToken(req) { //todo: maybe pass req.headers instead?
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  token = token.replace(" Bearer:  ", "")
  token = token.substring(7)
  token = jwt.decode(token, 'tuneup secret')
  return token

}