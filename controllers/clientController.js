const Client = require('../models/client')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

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
      console.warn(`An error occured in: client_get_all`);
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
      console.warn(`An error occured in: client_get_by_full_name`);
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
      console.warn(`An error occured in: client_get_by_phone_number`);
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}

const logout_get = (req, res) => {
  console.log(`Logged out client`);
  res.cookie('jwt', '', { maxAge: 1 })
  res.status(200).json({ message: 'Token deleted ' })
}

//END: ENDPOINTS FOR GET REQUESTS

//START: ENDPOINTS FOR POST REQUESTS (Create)

const register_post = async (req, res) => {
  try {
    const newClient = await Client.findOne({
      email: req.body.email,
      deleted: true
    })
    if (newClient) {
      const client = await Client.findOneAndUpdate(
        newClient.email,
        { deleted: false },
        { new: true }
      )
      client.first_name = req.body.first_name ? req.body.first_name : client.first_name
      client.last_name = req.body.last_name ? req.body.last_name : client.last_name
      client.address = req.body.address ? req.body.address : client.address
      client.phone_number = req.body.phone_number ? req.body.phone_number : client.phone_number
      client.email = req.body.email ? req.body.email : client.email
      client.password = await hashPassword(client.password)

      client.save()
        .then((result) => {
          console.log(`Delete client has been remade with the following info: ${result}`);
          const token = createToken(result._id)
          res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
          res.status(201).json({
            message: 'New client created!',
            client: result._id
          })
        })
        .catch((err) => {
          res.status(400).json({
            message: 'An error occured!',
            error: err.message
          })
        })

    } else {
      req.body.password = await hashPassword(req.body.password)
      const client = await Client.create(req.body)
      console.log(`Created client ${client.email}`);
      const token = createToken(client._id)
      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
      res.status(201).json({
        message: 'New clent created!',
        client: client._id
      })
    }
  } catch (err) {
    console.warn(`An error occured in register_post`);
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

const login_post = async (req, res) => {
  try {
    const client = await Client.login(req.body.email, req.body.password)
    console.log(`Logged in client ${client.email}`);
    const token = createToken(client._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
    res.status(200).json({ client: client._id })
  }
  catch (err) {
    console.warn(`An error occured in login_post`);
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

//END: ENDPOINTS FOR POST REQUESTS

//START: ENDPOINTS FOR PUT REQUESTS (Update)

const client_update = async (req, res) => {
  try {
    const token = getDecodedToken(req)
    const client = await Client.findById(token.id)

    client.first_name = req.body.first_name ? req.body.first_name : client.first_name
    client.last_name = req.body.last_name ? req.body.last_name : client.last_name
    client.address = req.body.address ? req.body.address : client.address
    client.phone_number = req.body.phone_number ? req.body.phone_number : client.phone_number
    client.email = req.body.email ? req.body.email : client.email
  } catch (err) {
    console.log(`An error occured in client_update`);
    res.status(400).json({
      message: 'An error occured!',
      error: err.message
    })
  }
}

//END: ENDPOINTS FOR PUT REQUESTS

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)

const client_delete = async (req, res) => {
  try {
    const token = getDecodedToken(req)
    const client = await Client.findOneAndUpdate(token.id, { deleted: true })
  } catch (err) {
    console.log(`An error occured in client_delete!`);
    res.status(400).json({
      message: 'An error occured!',
      error: err.message
    })
  }
}

//END: ENDPOINTS FOR DELETE REQUESTS

module.exports = {
  client_get_all,
  client_get_by_full_name,
  client_get_by_phone_number,
  register_post,
  login_post,
  logout_get,
  client_update,
  client_delete
}

function getDecodedToken(req) { //todo: maybe pass req.headers instead?
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  token = token.replace("Bearer ", "")
  token = jwt.decode(token, 'tuneup secret')
  return token
}

const hashPassword = async (password) => {
  //const salt = await bcrypt.genSalt() //TODO: add prints to see what the salt is and what the password is. 
  //password = await bcrypt.hash(password, salt)
  return password
}