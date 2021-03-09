const Vehicle = require('../models/vehicle')
const Client = require('../models/client')
const helpers = require('../helpers')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
require('dotenv').config()

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
    vin_number: '',
  }

  //duplicate error code
  if (err.code === 11000) {
    errors.license = 'License plate already exists'
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

//START: ENDPOINTS FOR GET REQUESTS (Retrieve)

const vehicle_get_all = (req, res) => {
  Vehicle.find({ deleted: false })
    .sort({ createdAt: -1 })
    .then((result) => {
      console.log('get of all vehicles!')
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn('An error occured in: vehicle_get_all')
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

const vehicle_get_all_of_client = async (req, res) => {
  const token = getDecodedToken(req)
  const client = await Client.findById(token.id).exec()
  await getVehiclesFromIds(client.vehicles).then((listOfVehicles, err) => {
    if (err) {
      console.warn('An error occured in: vehicle_get_client')
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    } else {
      console.log('Got all vehicles of client!')
      res.status(200).json(listOfVehicles)
    }
  })
}

const vehicle_get_by_licence = (req, res) => {
  Vehicle.findOne({
    license: req.query.license,
    deleted: false,
  })
    .then((result) => {
      console.log(`Found license: ${result.license}`)
      res.status(200).json({
        message: 'Vehicle found!',
        vehicle: result._id,
      })
    })
    .catch((err) => {
      console.warn('An error occured in: vehicle_get_by_license')
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

//send appointmentId in query params
const vehicle_get_vehicle_id_by_appointment_id = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      'appointments._id': req.query.appointmentId,
    })
    res.status(200).send(vehicle._id)
  } catch (err) {
    console.warn(
      `An error occured in vehicle_get_vehicle_id_by_appointment_id @ time: ${helpers.getTimeStamp()}`
    )
    console.log(`Error: ${err.message}`)
    res.status(400).json({
      message: 'Unable to get vehicleId',
      error: err.message,
    })
  }
}
// Send id in query params as well as the associated inspection_tier
//todo: sort based on system
const vehicle_get_health_attributes_by_vehicle_id = async (req, res) => {
  const vehicle = await Vehicle.findById(req.query.id)
  const allAttributes = vehicle.health_attributes
  const filteredAttributes = allAttributes.filter(
    (attribute) => attribute.inspection_tier == req.query.inspection_tier
  )
  res.status(200).json({
    //attributes: vehicle.health_attributes,
    attributes: filteredAttributes,
    summary: vehicle.health_attributes_summary,
    latest_insepction_tier: vehicle.latest_insepction_tier,
  })
}

//just send vehicleId in request
const vehicle_get_health_attributes_by_vehicle_id_and_last_inspection_tier = async (
  req,
  res
) => {
  const vehicle = await Vehicle.findById(req.query.vehicleId)
  const allAttributes = vehicle.health_attributes
  const filteredAttributes = allAttributes.filter(
    (attribute) => attribute.inspection_tier == vehicle.latest_insepction_tier
  )
  res.status(200).json({
    //attributes: vehicle.health_attributes,
    attributes: filteredAttributes,
    summary: vehicle.health_attributes_summary,
    latest_insepction_tier: vehicle.latest_insepction_tier,
  })
}

//END: ENDPOINTS FOR GET REQUESTS

//START: ENDPOINTS FOR POST REQUESTS (Create)

const vehicle_post = async (req, res) => {
  //TODO: make sure vehicle does not already exist (verify with vin)
  const decodedId = getDecodedToken(req)

  try {
    const vehicle = await Vehicle.findOne({
      license: req.body.license,
      deleted: true,
    })
    if (vehicle) {
      await Vehicle.findOneAndUpdate(
        { license: vehicle.license },
        { $set: req.body, deleted: false },
        { new: true },
        (err, result) => {
          if (err) {
            console.warn('An error occured in: vehicle_post')
            res.status(400).json({
              message: 'An error occured!',
              error: err.message,
            })
          } else {
            console.log(
              `Deleted vehicle has been remade with the following info: ${result}`
            )
            res.status(201).json(vehicle)
          }
        }
      )
    } else {
      //actually creating a new vehicle
      const vehicle = await Vehicle.create(req.body)
      await Client.addVehicle(decodedId.id, vehicle)
      console.log(`Vehicle ${vehicle.license} added to client ${decodedId.id}`)
      res.status(201).json(vehicle)
    }
  } catch (err) {
    console.warn('An error occured in vehicle_post')
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

//END: ENDPOINTS FOR POST REQUESTS

//START: ENDPOINTS FOR PUT REQUESTS (Update)

const vehicle_update = async (req, res) => {
  try {
    const body = _.omitBy(req.body, _.isNil)
    await Vehicle.findOneAndUpdate({ _id: body._id }, body, (err, result) => {
      if (err) {
        console.warn('An error occured in vehicle_update')
        res.status(400).json({
          message: 'An error occured!',
          error: err.message,
        })
      } else {
        console.log(`Vehicle updated: ${result._id}`)
        res.status(200).json({
          message: 'Vehicle updated!',
          vehicle: result._id,
        })
      }
    })
  } catch (err) {
    console.warn('An error occured in vehicle_update')
    res.status(400).json({
      message: 'An error occured',
      error: err.message,
    })
  }
}

/*
 * In body:
 *  health_attributes: An array which has the same structure and names as in the health_attributes part of the model. 
 !   make sure that the indexes for the services do not change!
 *  health_attributes_summary: The mechs summary for the latest inspection. (older notes will be overwritten.)
 *  latest_inspection_tier: the tier of the inspection that was just completed
 * In query params:
 *  vehicleId: the id of the vehicle the update belongs to 
 */
const vehicle_update_health_attributes = async (req, res) => {
  //here we're simply taking the list that is sent from the backend and using it to update
  //the values which have been changed.
  const body = _.omitBy(req.body, _.isNil)
  const vehicle = await Vehicle.findById(req.query.vehicleId)
  let health_attributes = vehicle.health_attributes
  const health_attributes2 = body.health_attributes
  health_attributes = health_attributes.map((attribute) => {
    let attribute2 = health_attributes2.find(
      (a2) => a2.attribute === attribute.attribute
    )
    attribute2 ? { ...attribute, ...attribute2 } : attribute
    if (attribute2) return attribute2
    else return attribute
  })
  vehicle.health_attributes = health_attributes
  vehicle.save()
  console.log(
    `vehicle health attributes: ${JSON.stringify(vehicle.health_attributes)}`
  )
  res.status(200).json({
    message: `Successfully Updated vehicle health attributes!`,
    id: vehicle._id,
  })
}

//END: ENDPOINTS FOR PUT REQUESTS

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)

const vehicle_delete = async (req, res) => {
  try {
    await Vehicle.findOneAndUpdate(
      { _id: req.query._id },
      { deleted: true },
      { new: true },
      (err, result) => {
        if (err) {
          console.warn(`An error occured in vehicle_delete!`)
          console.log(`Error: ${err.message}`)
          // res.status(400).json({
          //   message: 'An error occured!',
          //   error: err.message,
          // })
        } else {
          console.log(`Vehicle deleted ${result._id}`)
          const response = []
          for (appoint of result.appointments) {
            response.push(appoint._id)
          }
          //res.status(200).json(result.appoinments)
          res.status(200).send(response)
        }
      }
    )
  } catch (err) {
    console.warn(`An error occurred in vehicle_delete!`)
    console.log(`Error: ${err.message}`)
    res.status(400).json({
      message: 'An error occured!',
      error: err.message,
    })
  }
}

//END: ENDPOINTS FOR DELETE REQUESTS

module.exports = {
  vehicle_get_all,
  vehicle_get_all_of_client,
  vehicle_get_health_attributes_by_vehicle_id,
  vehicle_get_health_attributes_by_vehicle_id_and_last_inspection_tier,
  vehicle_get_vehicle_id_by_appointment_id,
  vehicle_post,
  vehicle_get_by_licence,
  vehicle_update,
  vehicle_update_health_attributes,
  vehicle_delete,
}

function getDecodedToken(req) {
  //todo: maybe pass req.headers instead?
  let token = req.headers['x-access-token'] || req.headers['authorization']
  token = token.replace('Bearer ', '')
  token = jwt.decode(token, process.env.JWT_SECRET)
  return token
}

const getVehiclesFromIds = async (listOfIds) => {
  try {
    const returnList = []
    for (i = 0; i < listOfIds.length; i++) {
      const vehicle = await Vehicle.findOne({
        _id: listOfIds[i]._id,
        deleted: false,
      })
      if (vehicle) {
        returnList.push(vehicle)
      }
    }
    console.log(`return list: ${returnList}`)
    return returnList
  } catch (err) {
    console.log(err)
  }
}
