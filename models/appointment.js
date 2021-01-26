const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CatalogService = require('./catalogService')
const CatalogProduct = require('./catalogProduct')
const Vehicle = require('./vehicle')

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
        type: String
    },
    skill_level: {
        type: Number,
        required: true
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
        }
    }],
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
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    archived: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    }
    //TODO: discount???

}, { timestamps: true })

const Appointment = mongoose.model('Appointment', appointmentSchema)
module.exports = Appointment