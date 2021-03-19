const Garage = require('../models/garage')
const _ = require('lodash')

const handleErrors = (err) => {
  console.log(err.message, err.code)
  let errors = {
    name: '',
    owner: '',
    email: '',
    phone_number: '',
    address: ''
  }

  if(err.code === 11000){
    errors.email = 'Email already exists'
    return errors
  }

  //validation errors
  if (err.message.includes('Garage validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message
    })
  }

  return errors
}

//START: ENDPOINTS FOR GET REQUESTS (Retrieve)

const garage_get_all = (req, res) => {
    Garage.find({ deleted: false }).sort({ createdAt: -1 })
        .then((result) => {
          console.log(`get of all garages!`);
            res.status(200).json(result)
        })
        .catch((err) => {
            console.warn(`An error occured in garage_get_all`)
            res.status(400).json({
              message: 'An error occured!',
              error: err.message
            })
        })
}

const garage_get_by_name = (req, res) => {
  Garage.find({
    name: req.query.name,
    deleted: false
  })
    .then((result) => {
      console.log(`get of garage by name!`);
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: garage_get_by_name`);
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}

const garage_get_by_owner = (req, res) => {
  Garage.find({
    owner: req.query.owner,
    deleted: false,
  })
    .then((result) => {
      console.log(`get of garage by owner!`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: garage_get_by_owner`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

//send garageId in query params
const garage_get_valet_queue_first_item = async (req, res) => {
  await Garage.aggredate([
    {
      $match: {
        _id: new ObjectId(req.query.garageId),
      },
    },
    {
      $unwind: {
        path: '$valet_pickup_queue',
      },
    },
    {
      $match: {
        'valet_pickup_queue.completed': false,
      },
    },
    {
      $sort: {
        'valet_pickup_queue.date': -1,
      },
    },
    {
      $group: {
        _id: '$valet_pickup_queue',
      },
    },
  ]).exec(async (err, queue) => {
    if (err) {
      helpers.printError(err, 'garage_get_valet_queue')
      res.status(400).json({
        message: 'Unable to get valet queue',
        error: err.message,
      })
    } else {
      res.status(200).json(queue[0])
    }
  })
}
//send garageId and appointmentId in query params
const garage_complete_item_from_valet_queue = async (req, res) => {
  await Garage.findById(req.query.garageId)
    .then((garage) => {
      const valet_queue = garage.valet_pickup_queue
      for (item of valet_queue) {
        if (item.appointment === req.query.appointmentId) {
          item.complete = true
          break
        }
      }
      garage.valet_pickup_queue = valet_queue
      garage.save()
      res.status(200).json({
        message: 'Updated valet item to complete',
      })
    })
    .catch((err) => {
      helpers.printError(err, 'garage_complete_item_from_valet_queue')
      res.status(400).json({
        message: 'Unable to complete valet trip',
        error: err.message,
      })
    })
}
//END: ENDPOINTS FOR GET REQUESTS

//START: ENDPOINTS FOR POST REQUESTS

const garage_create = async (req, res) => {
  try {
    const garage = await Garage.findOne({
      email: req.body.email,
      deleted: true,
    })
    if (garage) {
      await Garage.findOneAndUpdate(
        { email: garage.email },
        { $set: req.body, deleted: false },
        { new: true },
        (err, result) => {
          if (err) {
            console.warn('An error occured in garage_create')
            res.status(400).json({
              message: 'An error occured!',
              error: err.message,
            })
          } else {
            console.log(`Deleted garage recreated: ${result._id}`)
            res.status(200).json({
              message: 'Garage created!',
              garage: result._id,
            })
          }
        }
      )
    } else {
      const garage = await Garage.create(req.body)
      console.log(`Created garage ${garage.name}`)
      res.status(201).json({
        message: 'New garage created!',
        garage: garage._id,
      })
    }
  } catch (err) {
    console.warn(`An error occured in garage_client`)
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

//END: ENDPOINTS FOR POST REQUESTS

//START: ENDPOINTS FOR PUT REQUESTS (Update)

//END: ENDPOINTS FOR PUT REQUESTS

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)

//END: ENDPOINTS FOR DELETE REQUESTS

module.exports = {
    garage_create,
    garage_get_all,
    garage_get_by_name,
    garage_get_by_owner
}
