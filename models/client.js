const mongoose = require('mongoose')
const { isEmail } = require('validator')
const bcrypt = require('bcrypt')
const Schema = mongoose.Schema

const clientSchema = new Schema({
    email: {
        type: String,
        required: [true, 'PLease enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'PLease enter a password'],
        minlength: [6, 'Minimum password length is 6 characters']
    }
})

//fire function before doc saved to db
clientSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

const Client = mongoose.model('Client', clientSchema)
module.exports = Client