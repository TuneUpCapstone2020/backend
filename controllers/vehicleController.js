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

const vehicle_get_client = async (req, res) => {
  const token = getDecodedToken(req)
  const client = await Client.findById(token.id).exec()
  await getVehiclesFromIds(client.vehicles).then((listOfVehicles, err) => {
    if (err) {
      res.status(400).json({
        message: 'An error occured!',
        error: err
      });
    } else {
      res.status(200).json(listOfVehicles)
    }
  })
}

const vehicle_get_by_licence = (req, res) => {
  Vehicle.findOne({
    license: req.query.license,
    isDeleted: false
  })
    .then((result) => {
      res.status(200).json({
        message: 'Vehicle found!',
        vehicle: result._id
      })
    })
    .catch((err) => {
      res.status(400).json({
        message: 'An error occured!',
        error: err
      })
    })
}

//END: ENDPOINTS FOR GET REQUESTS

//START: ENDPOINTS FOR POST REQUESTS (Create)

const vehicle_post = async (req, res) => {
  //TODO: make sure vehicle does not already exist (verify with vin)
  const decodedId = getDecodedToken(req)

  try {
    const newVehicle = await Vehicle.findOne({
      license: req.body.license,
      isDeleted: true
    })
    if (newVehicle) {
      const vehicle = await Vehicle.findOneAndUpdate(
        newVehicle.license,
        { isDeleted: false },
        { new: true }
      )
      vehicle.make = req.body.make ? req.body.make : vehicle.make
      vehicle.model = req.body.model ? req.body.model : vehicle.model
      vehicle.nickname = req.body.nickname ? req.body.nickname : vehicle.nickname
      vehicle.license = req.body.license ? req.body.license : vehicle.license
      vehicle.year = req.body.year ? req.body.year : vehicle.year
      vehicle.mileage = req.body.mileage ? req.body.mileage : vehicle.mileage
      vehicle.vin_number = req.body.vin_number ? req.body.vin_number : vehicle.vin_number

      vehicle.save()
        .then((result) => {
          console.log(`Deleted vehicle has been remade with the following info: ${result}`)
          res.status(201).json({
            message: 'New vehicle created!',
            vehicle: result._id
          })
        })
        .catch((err) => {
          res.status(400).json({
            message: 'An error occured!',
            error: err
          })
        })
    } else { //actually creating a new vehicle
      const vehicle = await Vehicle.create(req.body)
      await Client.addVehicle(decodedId.id, vehicle)
      res.status(201).json({
        message: 'New vehicle created!',
        vehicle: vehicle._id
      })
    }
  } catch (err) {
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }

}

//END: ENDPOINTS FOR POST REQUESTS

//START: ENDPOINTS FOR PUT REQUESTS (Update)

const vehicle_update = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.body._id)

    vehicle.make = req.body.make ? req.body.make : vehicle.make
    vehicle.model = req.body.model ? req.body.model : vehicle.model
    vehicle.nickname = req.body.nickname ? req.body.nickname : vehicle.nickname
    vehicle.license = req.body.license ? req.body.license : vehicle.license
    vehicle.year = req.body.year ? req.body.year : vehicle.year
    vehicle.mileage = req.body.mileage ? req.body.mileage : vehicle.mileage
    vehicle.vin_number = req.body.vin_number ? req.body.vin_number : vehicle.vin_number

    vehicle.save()
      .then((result) => {
        console.log(`Vehicle Updated: ${vehicle._id}`)
        res.status(200).json({
          message: 'Vehicle Updated!',
          vehicle: result._id
        })
      })
      .catch((err) => {
        res.status(400).json({
          message: 'An error occured!',
          error: err
        })
      })

  } catch (err) {
    res.status(400).json({
      message: 'An error occured',
      error: err
    })
  }
}

//END: ENDPOINTS FOR PUT REQUESTS

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)

const vehicle_delete = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.query._id, { isDeleted: true })
    vehicle.save()
      .then((result) => {
        console.log(`Vehicle Deleted: ${vehicle._id}`)
        res.status(200).json({
          message: 'Vehicle Deleted!',
          vehicle: result._id
        })
      })
      .catch((err) => {
        res.status(400).json({
          message: 'An error occured!',
          error: err
        })
      })
  } catch (err) {
    res.status(400).json({
      message: 'An error occured!',
      error: err
    })
  }
}

//END: ENDPOINTS FOR DELETE REQUESTS


module.exports = {
  vehicle_get_client,
  vehicle_post,
  vehicle_get_by_licence,
  vehicle_update,
  vehicle_delete
}

function getDecodedToken(req) { //todo: maybe pass req.headers instead?
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  token = token.replace("Bearer ", "")
  token = jwt.decode(token, 'tuneup secret')
  return token

}

const getVehiclesFromIds = async (listOfIds) => {
  try {
    const returnList = []
    for (i = 0; i < listOfIds.length; i++) {
      const vehicle = await Vehicle.findOne({ _id: listOfIds[i]._id, isDeleted: false })
      if (vehicle) {
        returnList.push(vehicle)
      }
    }
    console.log(`return list: ${returnList}`)
    return returnList
  }
  catch (err) {
    console.log(err)
  }
};