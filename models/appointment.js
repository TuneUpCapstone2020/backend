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
    price: {
        type: Schema.Types.Decimal128,
        required: true
    },
    endTime: {
        type: String,
        required: false
    },
    employeeNum: {
        type: Number,
        required: false
    }
})

const Appointment = mongoose.model('Appointment', appointmentSchema)
module.exports = Appointment