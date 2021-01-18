const mongoose = require('mongoose')
const { isEmail } = require('validator')
const bcrypt = require('bcrypt')
const Schema = mongoose.Schema

const clientSchema = new Schema({
    firstName:{
        type: String,
        required: [true, 'Please enter your first name'],
        lowercase: true
    },
    lastName:{
        type: String,
        required: [true, 'Please enter your last name'],
        lowercase: true
    },
    address:{
        type: String,
        required: [true, 'Please enter your address']
    },
    phoneNumber:{
        type: String,
        required: [true, 'Please enter your phone number']
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Minimum password length is 6 characters']
    }
})

//fire function before doc saved to db
clientSchema.pre('save', async function (next) {
    //const salt = await bcrypt.genSalt()
    //this.password = await bcrypt.hash(this.password, salt)
    next()
})

//static method to login user
clientSchema.statics.login = async function(email, password){
    const client = await this.findOne({ email })
    if(client){
        //const auth = await bcrypt.compare(password, client.password)
        const auth = await password === client.password
        if(auth){
            return client
        }
        throw Error('incorrect password')
    }
    throw Error('incorrect email')
}

const Client = mongoose.model('Client', clientSchema)
module.exports = Client