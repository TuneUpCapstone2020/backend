const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CatalogService = require('./catalogService')
const CatalogProduct = require('./catalogProduct')
const Vehicle = require('./vehicle')
const Client = require('./client')

const appointmentSchema = new Schema({
    /*garageID: {
        type: Schema.Types.ObjectId,
        required: true
    },*/
    date: {
        type: Date,
        required: true,
        index: true
    },
    start_time: {
        type: Date
    },
    end_time: {
        type: Date
    },
    skill_level: {
        type: Number,
        required: true,
        default: 1
    },
    /*finalBill: {
        type: Boolean,
        required: true
    },*/
    final_price: { //to be generated when appointment is complete
        type: Number //stored in cents
    },
    employee_num: {
        type: Number,
        index: true
    },
    services: [{
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CatalogService'
        },
        quantity: { //ie tire change x4 
            type: Number,
            default: 1
        }
    }],
    total_estimated_time: {
        type: Number //stored in minutes,
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CatalogProduct'
        },
        quantity: {
            type: Number,
            default: 1
        }
    }],
    labour_time: { //!check for this before marking as complete
        type: Number, //stored in seconds
        default: 0
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    discount: {
        type: Number,
        default: 0
    },
    archived: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    }


}, { timestamps: true })

const Appointment = mongoose.model('Appointment', appointmentSchema)
module.exports = Appointment