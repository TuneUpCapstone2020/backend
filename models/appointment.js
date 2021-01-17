const mongoose = require('mongoose')
const Schema = mongoose.Schema

const appointmentSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    /*garageID: {
        type: Schema.Types.ObjectId,
        required: true
    },*/
    skillLevel: {
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