const Employee = require('../models/employee')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
require('dotenv').config()

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
    skill_level: '',
  }

  //incorrect employee number
  if (err.message === 'Incorrect employee number') {
    errors.employee_number = 'Incorrect employee number'
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
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  })
}

//START: ENDPOINTS FOR GET REQUESTS (Retrieve)

const employee_get_all = (req, res) => {
  Employee.find({ deleted: false })
    .sort({ createdAt: -1 })
    .then((result) => {
      console.log(`get of all employees!`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: employee_get_all`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

const employee_get_by_last_name = (req, res) => {
  Employee.find({
    last_name: req.query.last_name,
    deleted: false,
  })
    .then((result) => {
      console.log(`get of employee by last name`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: client_get_by_full_name`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

const employee_get_by_employee_number = (req, res) => {
  Employee.find({
    employee_number: req.query.employee_number,
    deleted: false,
  })
    .then((result) => {
      console.log(`get of employee by employee number`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: client_get_by_employee_number`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

const employee_get_by_phone_number = (req, res) => {
  Employee.find({
    phone_number: req.query.phone_number,
    deleted: false,
  })
    .then((result) => {
      console.log(`get of employee by phone number`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: client_get_by_phone_number`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

const employee_get_by_skill_level = (req, res) => {
  Employee.find({
    skill_level: req.query.skill_level,
    deleted: false,
  })
    .then((result) => {
      console.log(`get of employee by skill level`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: client_get_by_skill_level`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

const employee_logout = (req, res) => {
  console.log(`Logged out employee`)
  res.cookie('jwt', '', { maxAge: 1 })
  res.status(200).json({ message: 'Token deleted ' })
}

//END: ENDPOINTS FOR GET REQUESTS

//START: ENDPOINTS FOR POST REQUESTS (Create)

const employee_create = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      email: req.body.email,
      deleted: true,
    })
    if (employee) {
      await Employee.findOneAndUpdate(
        { email: employee.email },
        { $set: req.body, deleted: false },
        { new: true },
        (err, result) => {
          if (err) {
            console.warn('An error occured in employee_create')
            res.status(400).json({
              message: 'An error occured!',
              error: err.message,
            })
          } else {
            console.log(`Deleted employee recreated: ${result._id}`)
            res.status(200).json({
              message: 'Employee created!',
              client: result._id,
            })
          }
        }
      )
    } else {
      const employee = await Employee.create(req.body)
      console.log(`Created employee ${employee._id}`)
      res.status(201).json({
        message: 'New employee created!',
        client: employee._id,
      })
    }
  } catch (err) {
    console.warn(`An error occured in employee_create`)
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

const employee_login = async (req, res) => {
  try {
    const employee = await Employee.login(req.body.employee_number)
    console.log(`Logged in employee ${employee.employee_number}`)
    const token = createToken(employee._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
    res.status(200).json({
      message: 'Employee logged in!',
      employee: employee._id,
    })
  } catch (err) {
    console.warn(`An error occured in employee_login`)
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

//END: ENDPOINTS FOR POST REQUESTS

//START: ENDPOINTS FOR PUT REQUESTS (Update)

const employee_update = async (req, res) => {
  try {
    const token = getDecodedToken(req)
    const body = _.omitBy(req.body, _.isNil)
    await Employee.findOneAndUpdate({ _id: token.id }, body, (err, result) => {
      if (err) {
        console.warn('An error occured in employee_update')
        res.status(400).json({
          message: 'An error occured!',
          error: err.message,
        })
      } else {
        console.log(`Employee updated: ${result._id}`)
        res.status(200).json({
          message: 'Employee updated!',
          client: result._id,
        })
      }
    })
  } catch (err) {
    console.warn(`An error occured in employee_update`)
    res.status(400).json({
      message: 'An error occured!',
      error: err.message,
    })
  }
}

//END: ENDPOINTS FOR PUT REQUESTS

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)

const employee_delete = async (req, res) => {
  try {
    await Employee.findOneAndUpdate(
      { employee_number: req.query.employee_number },
      { deleted: true },
      (err, result) => {
        if (err) {
          console.warn(`An error occured in employee_delete!`)
          res.status(400).json({
            message: 'An error occured!',
            error: err.message,
          })
        } else {
          console.log(`Employee deleted ${result._id}`)
          res.status(200).json({
            message: 'Employee deleted!',
            client: result._id,
          })
        }
      }
    )
  } catch (err) {
    console.warn(`An error occured in employee_delete!`)
    res.status(400).json({
      message: 'An error occured!',
      error: err.message,
    })
  }
}

//END: ENDPOINTS FOR DELETE REQUESTS

module.exports = {
  employee_get_all,
  employee_get_by_last_name,
  employee_get_by_employee_number,
  employee_get_by_phone_number,
  employee_get_by_skill_level,
  employee_logout,
  employee_create,
  employee_login,
  employee_delete,
  employee_update,
}

function getDecodedToken(req) {
  //todo: maybe pass req.headers instead?
  let token = req.headers['x-access-token'] || req.headers['authorization']
  token = token.replace('Bearer ', '')
  token = jwt.decode(token, process.env.JWT_SECRET)
  return token
}
