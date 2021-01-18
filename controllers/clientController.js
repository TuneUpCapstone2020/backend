const Client = require('../models/client')
const jwt = require('jsonwebtoken')

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code)
  let errors = {
    firstName: '',
    lastName: '',
    address: '',
    phoneNumber: '',
    email: '',
    password: ''
  }

  //incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'that email is not registered'
  }

  //incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'that password is incorrect'
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

const register_get = (req, res) => {
  Client.find().sort({ createdAt: -1 })
    .then((result) => {
      res.send(result)
    })
    .catch((err) => {
      throw err
    })
}

const login_get = (req, res) => {
  console.log(req.body)
  const client = new Client(req.body)
  //const client = new Client({email: 'ggg', password: 'ff'})

  client.save()
    .then((result) => {
      res.redirect('/client')
    })
    .catch((err) => {
      throw err
    })
}

const register_post = async (req, res) => {
  const { firstName,
    lastName,
    address,
    phoneNumber,
    email,
    password } = req.body

  try {
    const client = await Client.create({ firstName, lastName, address, phoneNumber, email, password })
    const token = createToken(client._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
    res.status(201).json({ client: client._id })
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
  res.redirect('/')
}

module.exports = {
  register_get,
  login_get,
  register_post,
  login_post,
  logout_get
}