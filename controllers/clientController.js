const Client = require('../models/client')

//handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code)
  let errors = { email: '', password: '' }

  //duplicate error code
  if(err.code === 11000){
    errors.email = 'Email already exists'
    return errors
  }

  //validation errors
  if(err.message.includes('Client validation failed')){
    Object.values(err.errors).forEach(({properties}) => {
      errors[properties.path] = properties.message
    })
  }

  return errors
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
  const { email, password } = req.body

  try{
    const client = await Client.create({ email, password })
    res.status(201).json(client)
  }catch(err) {
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

const login_post = async (req, res) => {
  const client = new Client(req.body)

  client.save()
    .then((result) => {
      res.redirect('/client')
    })
    .catch((err) => {
      throw err
    })
}

module.exports = {
    register_get,
    login_get,
    register_post,
    login_post
}