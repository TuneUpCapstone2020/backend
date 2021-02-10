const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CatalogService = require('./catalogService')
const Garage = require('../models/garage')

const packagesSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      //unique???
    },
    starting_price: {
      type: Number, //stored in cents
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    disclaimer: {
      type: String,
    },
    garage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Garage',
      required: true,
    },
    services: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'catalogService',
          default: undefined,
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    total_estimated_time: {
      type: Number, //stored in minutes,
    },
    published: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

const Package = mongoose.model('Package', packagesSchema)
module.exports = Package
