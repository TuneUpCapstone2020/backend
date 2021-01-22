const mongoose = require('mongoose')
const { isEmail } = require('validator')
const Schema = mongoose.Schema

const employeeSchema = new Schema({
    employee_number: {
        type: Number,
        required: [true, 'Please enter employee number']
    },
    first_name: {
        type: String,
        required: [true, 'Please enter first name'],
        lowercase: true
    },
    last_name: {
        type: String,
        required: [true, 'Please enter last name'],
        lowercase: true
    },
    pwd: {
        type: String,
        required: [true, 'Please enter pwd']
    },
    phone_number: {
        type: String,
        required: [true, 'Please enter phone number']
    },
    email: {
        type: String,
        required: [true, 'Please enter email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter valid email']
    },
    address: {
        type: String,
        required: [true, 'Please enter address']
    },
    wage: {
        type: mongoose.Schema.Types.Decimal128,
        required: [true, 'Please enter wage']
    },
    skill_level:{
        type: Number,
        required: [true, 'Please enter skill level']
    }
})

const Employee = mongoose.model('Employee', employeeSchema)
module.exports = Employee