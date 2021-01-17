const Client = require('../models/client')

const client_index = (req, res) => {
    Client.find().sort({ createdAt: -1 })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            throw err
        })
}

const client_create_client = (req, res) => {
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

module.exports = {
    client_index,
    client_create_client
}