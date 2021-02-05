const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CatalogService = require('./catalogService')

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
    },
    disclaimer: {
      type: String,
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
  },
  { timestamps: true }
)

const Package = mongoose.model('Package', packagesSchema)
module.exports = Package
