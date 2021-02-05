const mongoose = require('mongoose')
const Employee = require('./employee')
const { isEmail } = require('validator')
const Schema = mongoose.Schema

const garageSchema = new Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    owner: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter valid email']
    },
    phone_number: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    employees: [{
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
    }],
    deleted: {
        type: Boolean,
        default: false
    }
    
}, { timestamps: true })

garageSchema.statics.getAppointmentCapacity = function () {
  return this.appointment_capacity
}

garageSchema.statics.getStandardHourlyRate = function () {
  return this.standard_hourly_rate
}

garageSchema.statics.getOpeningTime = function () {
  return this.opening_time
}
garageSchema.statics.getClosingTime = function () {
  return this.closing_time
}

const Garage = mongoose.model('Garage', garageSchema)
module.exports = Garage
