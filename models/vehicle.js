const mongoose = require('mongoose')
const Schema = mongoose.Schema

const vehicleSchema = new Schema({
    year: {
        type: Number,
        required: true
    },
    make: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    }
})

const Vehicle = mongoose.model('Vehicle', vehicleSchema)
module.exports = Vehicle