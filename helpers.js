const dateFormat = require('dateformat')
const jwt = require('jsonwebtoken')
const VehicleMake = require('./models/vehicleMake')
const VehicleModel = require('./models/vehicleModel')
const Vehicle = require('./models/vehicle')
require('dotenv').config()

const getTimeStamp = () => {
  let date_ob = new Date()
  // let date = ('0' + date_ob.getDate).slice(-2)
  // let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
  // let year = date_ob.getFullYear()
  // let hours = date_ob.getHours()
  // let minutes = date_ob.getMinutes()
  // let seconds = date_ob.getSeconds()

  // return `${seconds}:${minutes}:${hours} ${date}-${month}-${year}`
  //return dateFormat(date_ob, 'hh:MM:ss dd-mm-yyyy')
  return dateFormat(date_ob, 'isoDateTime')
}

function getDecodedToken(req) {
  //todo: maybe pass req.headers instead?
  let token = req.headers['x-access-token'] || req.headers['authorization']
  token = token.replace('Bearer ', '')
  token = jwt.decode(token, process.env.JWT_SECRET)
  return token
}

const populateVehicles = () => {
  console.log(`Populating vehicles @ time: ${getTimeStamp()}`)
  //populate collections
  const makes = require('./makes.json')
  const models = require('./models.json')
  VehicleMake.collection.insertMany(makes)
  VehicleModel.collection.insertMany(models)

  //configure indexes
  VehicleMake.syncIndexes()
  VehicleModel.syncIndexes()
  console.log(`Done populating vehicles @ time: ${getTimeStamp()}`)
}

const populateVehicleAttributes = async (vehicleId) => {
  console.log(`Populating vehicle attributes @ time: ${getTimeStamp()}`)
  const vehicle = await Vehicle.findById(vehicleId)
  const attributes = require('./attributes.json')

  for (attribute of attributes) {
    vehicle.health_attributes.push(attribute)
  }
  console.log(`Done populating vehicle attributes @ time: ${getTimeStamp()}`)
}

module.exports = {
  getTimeStamp,
  getDecodedToken,
  populateVehicles,
  populateVehicleAttributes,
}
