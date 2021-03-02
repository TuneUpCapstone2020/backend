const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Appointment = require('./appointment')

const valetRouteSchema = new Schema(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    gps_coordinates: {
      type: {
        type: String,
        default: 'LineString',
      },
      coordinates: [Array], //store as [latitude, longitude]
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ValetRoute', valetRouteSchema)
