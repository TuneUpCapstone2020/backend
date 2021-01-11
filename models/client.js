const mongoose = require('mongoose')
const Schema = mongoose.Schema

const clientSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String
    },
    address: {
        type: String
    }
})

const Client = mongoose.model('Client', clientSchema)
module.exports = Client