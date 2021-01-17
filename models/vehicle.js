const mongoose = require('mongoose')
const Schema = mongoose.Schema

const vehicleSchema = new Schema({
    make: {
        type: String,
        required: [true, 'Please enter make']
    },
    model: {
        type: String,
        required: [true, 'Please enter model']
    },
    year: {
        type: Number,
        required: [true, 'Please enter year']
    }
})

const Vehicle = mongoose.model('Vehicle', vehicleSchema)
module.exports = Vehicle