const Vehicle = require('../models/vehicle')
const Client = require('../models/client')
const jwt = require('jsonwebtoken')

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code)
  let errors = {
    make: '',
    model: '',
    nickname: '',
    license: '',
    year: '',
    mileage: '',
    vin_number: ''
  }

  //duplicate error code
  if (err.code === 11000) {
    errors.vin_number = 'VIN already exists'
    return errors
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
  const token = getDecodedToken(req)
  const client = await Client.findById(token.id).exec()
  await getVehiclesFromIds(client.vehicles).then((listOfVehicles, err) => {
    if (err) { console.error(err); }
    res.status(200).json(listOfVehicles)
  })
}

const getVehiclesFromIds = async (listOfIds) => {
  try {
    const returnList = []
    for (i = 0; i < listOfIds.length; i++) {
      returnList.push(await Vehicle.findById(listOfIds[i]._id))
    }
    return returnList
  }
  catch (err) {
    console.log(err)
  }
};

const vehicle_post = async (req, res) => {
  //TODO: make sure vehicle does not already exist (verify with vin)
  const { make, model, nickname, license, year, mileage, vin_number } = req.body
  const decodedId = getDecodedToken(req)

  try {
    const vehicle = await Vehicle.create({ make, model, nickname, license, year, mileage, vin_number })
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
  token = token.replace("Bearer ", "")
  token = jwt.decode(token, 'tuneup secret')
  return token

}