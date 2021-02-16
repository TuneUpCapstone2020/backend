const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Appointment = require('./appointment')

const vehicleSchema = new Schema(
  {
    make: {
      type: String,
      required: [true, 'Please enter make'],
    },
    model: {
      type: String,
      required: [true, 'Please enter model'],
    },
    nickname: {
      type: String,
    },
    license: {
      type: String,
      required: [true, 'Please enter license plate'],
      unique: true,
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Please enter year'],
    },
    mileage: {
      type: Number,
      required: [true, 'Please enter mileage'],
    },
    vin_number: {
      type: String,
      //unique: true
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    appointments: [
      {
        appointment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Appointment',
        },
      },
    ],
  },
  { timestamps: true }
)

vehicleSchema.statics.addAppointment = async function (vehicleId, appointment) {
  const vehicle = await this.findById(vehicleId).exec()
  if (vehicle) {
    vehicle.appointments.push(appointment._id)
    console.log(`Added new appointment to vehicle: ${appointment._id}`)
    vehicle.save()
  } else throw Error('Vehicle not found')
}

const Vehicle = mongoose.model('Vehicle', vehicleSchema)
module.exports = Vehicle
