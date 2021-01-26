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
    nickname: {
        type: String
    },
    license: {
        type: String,
        required: [true, 'Please enter license plate'],
        unique: true,
        index: true
    },
    year: {
        type: Number,
        required: [true, 'Please enter year']
    },
    mileage: {
        type: Number,
        required: [true, 'Please enter mileage']
    },
    vin_number: {
        type: String,
        //unique: true
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Vehicle = mongoose.model('Vehicle', vehicleSchema)
module.exports = Vehicle