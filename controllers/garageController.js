const Garage = require('../models/garage')

const garage_index = (req, res) => {
    Garage.find().sort({ createdAt: -1 })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            throw err
        })
}

const garage_create_garage = (req, res) => {
    //console.log(req.body)
    //const garage = new Garage(req.body)
    const garage = new Garage({name: 'Joe\'s Garage',owner: 'Joe Blow', email: 'joe@joesgarage.com', phoneNum: '514-555-6969', address: '420 Fixit Ave.'})
  
    garage.save()
      .then((result) => {
        res.redirect('/client')
      })
      .catch((err) => {
        throw err
      })
}

module.exports = {
    garage_index,
    garage_create_garage
}