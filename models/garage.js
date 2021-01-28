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
    },
    appointment_capacity: {
        type: Number,
        required: true
    },
    opening_time: {
        type: Number,
        required: true
    },
    closing_time: {
        type: Number,
        required: true
    }

})

garageSchema.statics.getAppointmentCapacity = function () {
    return this.appointment_capacity
}

garageSchema.statics.getStandardHourlyRate = function () {
    return this.standard_hourly_rate
}



const Garage = mongoose.model('Garage', garageSchema)
module.exports = Garage