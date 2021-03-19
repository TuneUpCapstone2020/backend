const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CatalogService = require('./catalogService')
const CatalogProduct = require('./catalogProduct')
//const Vehicle = require('./vehicle')
const Client = require('./client')

const appointmentSchema = new Schema(
  {
    garageId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    start_time: {
      type: Date,
    },
    end_time: {
      type: Date,
    },
    skill_level: {
      type: Number,
      required: true,
      default: 1,
    },
    /*finalBill: {
        type: Boolean,
        required: true
    },*/
    final_price: {
      //to be generated when appointment is complete
      type: Number, //stored in cents
      // default: 0,
    },
    employee_num: {
      type: Number,
      index: true,
    },
    services: [
      {
        //_id: false,
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CatalogService',
          default: undefined,
        },
        quantity: {
          //ie tire change x4
          type: Number,
          default: 1,
        },
        service_is_complete: {
          type: Boolean,
          default: false,
        },
      },
    ],
    total_estimated_time: {
      type: Number, //stored in minutes,
    },
    products: [
      {
        //_id: false,
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CatalogProduct',
          default: undefined,
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    labour_time: {
      //!check for this before marking as complete
      type: Number, //stored in seconds
      default: 0,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    client_phone_number: {
      type: String,
    },
    discount: {
      type: Number, //format: 10=10% off, 15=15% off, etc
      default: 0,
    },
    description: {
      type: String,
    },
    appointment_status: {
      type: Number,
      default: 0,
    },
    valet_required: {
      type: Boolean,
      default: false,
    },
    valet_pickup_address: {
      type: Array,
      default: [],
    },
    customer_note: {
      type: String,
    },
    customer_image_urls: [{ type: String, default: [] }],
    archived: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

const Appointment = mongoose.model('Appointment', appointmentSchema)
module.exports = Appointment
