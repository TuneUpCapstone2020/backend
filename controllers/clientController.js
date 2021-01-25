const Client = require('../models/client')
const jwt = require('jsonwebtoken')

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code)
  let errors = {
    first_name: '',
    last_name: '',
    address: '',
    phone_number: '',
    email: '',
    password: ''
  }

  //incorrect email
  if (err.message === 'Incorrect email or password') {
    errors.email = 'Incorrect email or password'
  }

  //incorrect password
  if (err.message === 'Incorrect email or password') {
    errors.password = 'Incorrect email or password'
  }

  //duplicate error code
  if (err.code === 11000) {
    errors.email = 'Email already exists'
    return errors
  }

  //validation errors
  if (err.message.includes('Client validation failed')) {
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

//START: ENDPOINTS FOR GET REQUESTS (Retrieve)

const client_get_all = (req, res) => {
  Client.find({ deleted: false }).sort({ createdAt: -1 })
    .then((result) => {
      console.log(`get of all clients!`);
      res.status(200).json(result)
    })
    .catch((err) => {
      console.log(`An error occured in: client_get_all`);
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}

const client_get_by_full_name = (req, res) => {
  Client.find({
    full_name: req.query.full_name,
    deleted: false
  })
    .then((result) => {
      console.log(`get of client by full name!`);
      res.status(200).json(result)
    })
    .catch((err) => {
      console.log(`An error occured in: client_get_by_full_name`);
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}

const client_get_by_phone_number = (req, res) => {
  Client.find({
    phone_number: req.query.phone_number,
    deleted: false
  })
    .then((result) => {
      console.log(`get of client by phone number!`);
      res.status(200).json(result)
    })
    .catch((err) => {
      console.log(`An error occured in: client_get_by_phone_number`);
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}

//END: ENDPOINTS FOR GET REQUESTS

const register_post = async (req, res) => {
  try {
    const client = await Client.create(req.body)
    console.log(`Created client ${client.email}`);
    const token = createToken(client._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
    res.status(201).json({ 
      message: 'New clent created!',
      client: client._id
    })
  } catch (err) {
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

const login_post = async (req, res) => {
  const { email, password } = req.body

  try {
    const client = await Client.login(email, password)
    const token = createToken(client._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
    res.status(200).json({ client: client._id })
  }
  catch (err) {
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

const logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 })
  res.status(200).json({ msg: 'Token deleted ' })
  //res.redirect('/')
}

module.exports = {
  register_get,
  login_get,
  register_post,
  login_post,
  logout_get
}