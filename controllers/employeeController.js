const Employee = require('../models/employee')
const jwt = require('jsonwebtoken')

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code)
  let errors = {
    employee_number: '',
    first_name: '',
    last_name: '',
    pwd: '',
    phone_number: '',
    email: '',
    address: '',
    wage: '',
    skill_level: ''
  }

  //duplicate error code
  if (err.code === 11000) {
    errors.email = 'Email already exists'
    return errors
  }

  //validation errors
  if (err.message.includes('Employee validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message
    })
  }

  return errors
}

const maxAge = 3 * 24 * 60 * 60 //3 days in seconds

const createToken = (id) => {
  //TODO make better secret to sign token
  return jwt.sign({ id }, 'tuneup secret', {
    expiresIn: maxAge
  })
}

const employee_get = (req, res) => {
    Employee.find().sort({ createdAt: -1 })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            throw err
        })
}

const employee_post = async (req, res) => {
  const { employee_number,
    first_name,
    last_name,
    pwd,
    phone_number,
    email,
    address,
    wage,
    skill_level } = req.body
  
    try {
      const employee = await Employee.create({ employee_number, first_name, last_name, pwd, phone_number, email, address, wage, skill_level })
      const token = createToken(employee._id)
      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
      res.status(201).json({ employee: employee._id })
    } catch (err) {
      const errors = handleErrors(err)
      res.status(400).json({ errors })
    }
}

module.exports = {
    employee_get,
    employee_post
}