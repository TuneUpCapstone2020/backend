const mongoose = require('mongoose')
const Schema = mongoose.Schema

//! The naming conventions for field names don't match other
//! models in order to maintain compatibility with the vehicle API
const vehicleModelSchema = new Schema(
  {
    Make_ID: {
      type: Number,
      required: true,
      index: true,
    },
    Make_Name: {
      type: String,
      required: true,
    },
    Model_ID: {
      type: Number,
      required: true,
      index: true,
    },
    Model_Name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

const VehicleModel = mongoose.model('VehicleModel', vehicleModelSchema)
module.exports = VehicleModel
