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
    nickName: {
        type: String
    },
    license: {
        type: String,
        required: [true, 'Please enter license plate']
    },
    year: {
        type: Number,
        required: [true, 'Please enter year']
    },
    mileage: {
        type: Number,
        required: [true, 'Please enter mileage']
    },
    vinNumber: {
        type: Number,
        required: [true, 'Please enter VIN number']
    }
})

const Vehicle = mongoose.model('Vehicle', vehicleSchema)
module.exports = Vehicle