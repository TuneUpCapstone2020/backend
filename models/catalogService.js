const mongoose = require('mongoose')
const Schema = mongoose.Schema

const catalogService = new Schema({
  name: {
    type: String,
    required: true,
    index: true,
  },
  garage_service_number: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  description: {
    type: String,
  },
  time_estimate: {
    type: Number, //time stored in seconds
    required: true,
  },
  skill_level: {
    type: Number, //enum corresponding to skill level
    required: true,
  },
  customer_note: {
    //the solution to a client's issue ()
    type: String,
  },
  price: {
    type: Number, //stored in cents
    default: 00,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
})

const CatalogService = mongoose.model('CatalogService', catalogService)
module.exports = CatalogService
