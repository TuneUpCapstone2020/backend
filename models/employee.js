const mongoose = require('mongoose')
const Schema = mongoose.Schema

const employeeSchema = new Schema({
    employeeNum: {
        type: Uint16Array,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    pwd: {
        type: String,
        required: true
    },
    phoneNum: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    wage: {
        type: Float32Array,
        required: true
    },
    skillLevel:{
        type: Uint16Array,
        required: true
    }
})

const Employee = mongoose.model('Employee', employeeSchema)
module.exports = Employee