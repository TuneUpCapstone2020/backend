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
    skill_level: {
      type: Number,
      default: 0,
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

packagesSchema.pre('save', async function (next) {
  const services = this.services
  let skill_level = 0
  console.log(`Services: ${JSON.stringify(services)}`)
  for (let i of services) {
    const service = await CatalogService.findById(i.service).exec()
    if (service.skill_level > skill_level) {
      skill_level = service.skill_level
    }
  }
  this.skill_level = skill_level
})

const Package = mongoose.model('Package', packagesSchema)
module.exports = Package
