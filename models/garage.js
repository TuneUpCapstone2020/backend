const mongoose = require('mongoose')
const Schema = mongoose.Schema

const garageSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNum: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    standard_hourly_rate: {
        type: Number, //stored in cents
        required: true
    }

})

const Garage = mongoose.model('Garage', garageSchema)
module.exports = Garage