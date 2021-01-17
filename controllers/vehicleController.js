const Vehicle = require('../models/vehicle')

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code)
  let errors = { year: '', make: '', model: '' }

  //validation errors
  if(err.message.includes('Vehicle validation failed')){
    Object.values(err.errors).forEach(({properties}) => {
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
    const { year, make, model } = req.body

    try{
      const vehicle = await Vehicle.create({ year, make, model })
      res.status(201).json({ vehicle: vehicle._id })
    }catch(err){
      const errors = handleErrors(err)
      res.status(400).json({ errors })
    }
}

module.exports = {
    vehicle_get,
    vehicle_post
}