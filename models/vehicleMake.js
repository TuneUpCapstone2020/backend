const mongoose = require('mongoose')
const Schema = mongoose.Schema

//! The naming conventions for field names don't match other
//! models in order to maintain compatibility with the vehicle API
const vehicleMakeSchema = new Schema(
  {
    MakeId: {
      type: Number,
      required: true,
    },
    MakeName: {
      type: String,
      required: true,
    },
    VehicleTypeId: {
      type: Number,
      required: true,
    },
    VehicleTypeName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

const VehicleMake = mongoose.model('VehicleMake', vehicleMakeSchema)
module.exports = VehicleMake
