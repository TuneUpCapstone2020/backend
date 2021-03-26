const VehicleMake = require('../models/vehicleMake')
const VehicleModel = require('../models/vehicleModel')
const helpers = require('../helpers')

//Create - not required
//Retrieve
const vehicle_make_get_all = (req, res) => {
  VehicleMake.find({})
    .sort({ MakeName: 1 })
    .then((makes) => {
      console.log(`Get all vehicle makes @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(makes)
    })
    .catch((err) => {
      console.warn(
        `An error occurred in vehicle_make_get_all @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get all makes',
        error: err.message,
      })
    })
}

const vehicle_models_get_all = (req, res) => {
  VehicleModel.find({})
    .sort({ Model_Name: 1 })
    .then((models) => {
      console.log(`Get all vehicle models @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(models)
    })
    .catch((err) => {
      console.warn(
        `An error occured in vehicle_models_get_all @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get all models',
        error: err.message,
      })
    })
}

//send makeId as int in query params
const vehicle_models_get_by_make_id = (req, res) => {
  VehicleModel.find({ Make_ID: req.query.makeId })
    .then((model) => {
      console.log(`Get vehicle by model ID @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(model)
    })
    .catch((err) => {
      console.warn(
        `An error occured in vehicle_models_get_by_make_id @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get models',
        error: err.message,
      })
    })
}

//send make in query params
const vehicle_make_get_make_logo_url_by_make = (req, res) => {
  const make = VehicleMake.findOne({ MakeName: req.query.make })
    .then(res.status(200).json({ url: make.VehicleMakeLogoUrl }))
    .catch((err) => {
      helpers.printError(err, 'vehicle_make_get_make_logo_url_by_make')
      res.status(400).json({
        message: 'Unable to get make logo url',
        error: err.message,
      })
    })
}
module.exports = {
  vehicle_make_get_all,
  vehicle_models_get_all,
  vehicle_models_get_by_make_id,
  vehicle_make_get_make_logo_url_by_make,
}
