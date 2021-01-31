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
    deleted: false
  })
    .then((result) => {
      console.log(`get of garage by owner!`);
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: garage_get_by_owner`);
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}

//END: ENDPOINTS FOR GET REQUESTS

//START: ENDPOINTS FOR POST REQUESTS

const garage_create = async (req, res) => {
    try{
      const garage = await Garage.findOne({
        email: req.body.email,
        deleted: true
      })
      if(garage){
        await Garage.findOneAndUpdate({ email: garage.email }, { $set: req.body, deleted: false }, { new: true }, (err, result) => {
          if(err){
            console.warn('An error occured in garage_create')
            res.status(400).json({
              message: 'An error occured!',
              error: err.message
            })
          }else{
            console.log(`Deleted garage recreated: ${result._id}`);
            res.status(200).json({
              message: 'Garage created!',
              garage: result._id
            })
          }
        })
      }else{
        const garage = await Garage.create(req.body)
        console.log(`Created garage ${garage.name}`);
        res.status(201).json({
          message: 'New garage created!',
          garage: garage._id
        })
      }
    }catch(err){
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