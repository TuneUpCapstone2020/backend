const Client = require('../models/client')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const helpers = require('../helpers')
require('dotenv').config()

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code)
  let errors = {
    first_name: '',
    last_name: '',
    address: '',
    phone_number: '',
    email: '',
    password: '',
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
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  })
}

//START: ENDPOINTS FOR GET REQUESTS (Retrieve)

const client_get_all = (req, res) => {
  Client.find({ deleted: false })
    .sort({ createdAt: -1 })
    .then((result) => {
      console.log(`get of all clients!`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: client_get_all`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

const client_get_by_full_name = (req, res) => {
  Client.find({
    full_name: req.query.full_name,
    deleted: false,
  })
    .then((result) => {
      console.log(`get of client by full name!`)
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

const client_get_by_phone_number = (req, res) => {
  Client.find({
    phone_number: req.query.phone_number,
    deleted: false,
  })
    .then((result) => {
      console.log(`get of client by phone number!`)
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

//send clientId in the query params
const logout_get = async (req, res) => {
  const token = helpers.getDecodedToken(req)
  await Client.findByIdAndUpdate(
    token.id,
    {
      deviceId: '',
      devicePlatform: '',
    },
    { new: true },
    (err, result) => {
      if (err) {
        console.warn(
          `An error occured in logout_get @ time: ${helpers.getTimeStamp()}`
        )
        console.log(`Error: ${err.message}`)
      } else {
        console.log(`Logged out client`)
        res.cookie('jwt', '', { maxAge: 1 })
        res.status(200).json({ message: 'Token deleted ' })
      }
    }
  )
}

//END: ENDPOINTS FOR GET REQUESTS

//START: ENDPOINTS FOR POST REQUESTS (Create)

const register_post = async (req, res) => {
  try {
    const client = await Client.findOne({
      email: req.body.email,
      deleted: true,
    })
    if (client) {
      req.body.password = await hashPassword(req.body.password)
      await Client.findOneAndUpdate(
        { email: client.email },
        { $set: req.body, deleted: false },
        { new: true },
        (err, result) => {
          if (err) {
            console.warn('An error occured in register_post')
            res.status(400).json({
              message: 'An error occured!',
              error: err.message,
            })
          } else {
            console.log(`Deleted client recreated: ${result._id}`)
            const token = createToken(result._id)
            res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
            result.password = ''
            result.deviceId = ''
            res.status(200).json(result)
          }
        }
      )
    } else {
      req.body.password = await hashPassword(req.body.password)
      const client = await Client.create(req.body)
      console.log(`Created client ${client.email}`)
      const token = createToken(client._id)
      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
      client.password = ''
      client.deviceId = ''
      res.status(201).json(client)
    }
  } catch (err) {
    console.warn(`An error occured in register_post`)
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

const login_post = async (req, res) => {
  try {
    const client = await Client.login(
      req.body.email,
      req.body.password,
      req.body.deviceId,
      req.body.devicePlatform
    )
    console.log(
      `Logged in client ${client.email} @ time ${helpers.getTimeStamp()}`
    )
    const token = createToken(client._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
    // client.password = ""
    // client.deviceId = ""
    const retVal = {
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      profile_image_url: client.profile_image_url,
    }

    res.status(200).json(retVal)
  } catch (err) {
    console.warn(`An error occured in login_post`)
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

//Send url of the profile pic as profile_image_url in body
const upload_profile_pic_url = async (req, res) => {
  const token = helpers.getDecodedToken(req)
  await Client.findByIdAndUpdate(
    token.id,
    {
      profile_image_url: req.body.profile_image_url,
    },
    { new: true },
    (err, profile) => {
      if (err) {
        helpers.printError(err, 'upload_profile_pic_url')
        res.status(400).json({
          message: 'Unable to set profile pic',
          error: err.message,
        })
      } else {
        res.status(200).json({ message: 'Profile picture sucessfully updated' })
      }
    }
  )
}
//END: ENDPOINTS FOR POST REQUESTS

//START: ENDPOINTS FOR PUT REQUESTS (Update)

const client_update = async (req, res) => {
  try {
    const token = getDecodedToken(req)
    const body = _.omitBy(req.body, _.isNil)
    await Client.findOneAndUpdate({ _id: token.id }, body, (err, result) => {
      if (err) {
        console.warn('An error occured in client_update')
        res.status(400).json({
          message: 'An error occured!',
          error: err.message,
        })
      } else {
        console.log(`Client updated: ${result._id}`)
        res.status(200).json({
          message: 'Client updated!',
          client: result._id,
        })
      }
    })
  } catch (err) {
    console.warn(`An error occured in client_update`)
    res.status(400).json({
      message: 'An error occured!',
      error: err.message,
    })
  }
}

//END: ENDPOINTS FOR PUT REQUESTS

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)

const client_delete = async (req, res) => {
  try {
    const token = getDecodedToken(req)
    await Client.findOneAndUpdate(
      token.id,
      { deleted: true },
      (err, result) => {
        if (err) {
          console.warn(`An error occured in client_delete!`)
          res.status(400).json({
            message: 'An error occured!',
            error: err.message,
          })
        } else {
          console.log(`Client deleted ${result._id}`)
          res.status(200).json({
            message: 'Client deleted!',
            client: result._id,
          })
        }
      }
    )
  } catch (err) {
    console.warn(`An error occured in client_delete!`)
    res.status(400).json({
      message: 'An error occured!',
      error: err.message,
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
  upload_profile_pic_url,
  logout_get,
  client_update,
  client_delete,
}

function getDecodedToken(req) {
  //todo: maybe pass req.headers instead?
  let token = req.headers['x-access-token'] || req.headers['authorization']
  //console.log(`Token1: ${token}`)
  token = token.replace('Bearer ', '')
  //console.log(`Token2: ${token}`)
  const secret = process.env.JWT_SECRET
  token = jwt.decode(token, secret)
  //console.log(`Token3: ${token}`)

  return token
}

const hashPassword = async (password) => {
  //const salt = await bcrypt.genSalt() //TODO: add prints to see what the salt is and what the password is.
  //password = await bcrypt.hash(password, salt)
  // console.log(`Hashing a password!`)
  // const pass = 'bob'
  // let passCrypt = await bcrypt.hash(pass, 10, function (err, hash) {
  //   if (err) {
  //     console.log(`An error occurred while hashing!`)
  //     console.log(`Error: ${err.message}`)
  //   }
  //   console.log(`Hashed pass is: ${hash}`)
  // })
  // console.log(`passCrypt: ${passCrypt}`)
  return password
}
