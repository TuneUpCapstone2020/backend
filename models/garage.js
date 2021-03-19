const mongoose = require('mongoose')
const Employee = require('./employee')
const Vehicle = require('./vehicle')
const Appointment = require('./appointment')
const { isEmail } = require('validator')
const Schema = mongoose.Schema

const garageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [isEmail, 'Please enter valid email'],
    },
    phone_number: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    standard_hourly_rate: {
      type: Number, //stored in cents
      required: true,
    },
    appointment_capacity: {
      type: Number,
      required: true,
    },
    opening_time: {
      type: Number, //store the time it opens in minutes since 12:00am
      required: true,
    },
    closing_time: {
      type: Number, //time in minutes from 12:00am to closing
      required: true,
    },
    employees: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
      },
    ],
    valet_pickup_queue: [
      {
        vehicle: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Vehicle',
        },
        appointment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Appointment',
        },
        pickup_time: Date,
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

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
