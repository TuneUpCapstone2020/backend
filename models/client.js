const mongoose = require('mongoose')
const { isEmail } = require('validator')
const Schema = mongoose.Schema
const Vehicle = require('./vehicle')
const bcrypt = require('bcrypt')
const bcryptjs = require('bcryptjs')

const clientSchema = new Schema(
  {
    first_name: {
      type: String,
      required: [true, 'Please enter your first name'],
      lowercase: true,
    },
    last_name: {
      type: String,
      required: [true, 'Please enter your last name'],
      lowercase: true,
    },
    full_name: {
      type: String,
      index: true,
    },
    address: {
      type: String,
      //required: [true, 'Please enter your address']
    },
    phone_number: {
      type: String,
      index: true,
      //required: [true, 'Please enter your phone number']
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      lowercase: true,
      validate: [isEmail, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: [6, 'Minimum password length is 6 characters'],
    },
    vehicles: [
      {
        vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

//fire function before doc saved to db
clientSchema.pre('save', async function (next) {
  this.full_name = `${this.first_name} ${this.last_name}`
  if (this.isModified('password')) {
    //this.password = await bcrypt.hash(this.password, 10)
    //this.password = await bcrypt.hashSync(this.password, 8)
    this.password = await bcryptjs.hash(this.password, 8)
  }
  next()
})
clientSchema.pre('update', async function (next) {
  this.full_name = `${this.first_name} ${this.last_name}`
  if (this.isModified('password')) {
    //this.password = await bcrypt.hash(this.password, 10)
    //this.password = await bcrypt.hashSync(this.password, 8)
    this.password = await bcryptjs.hash(this.password, 8)
  }
  next()
})

//todo: test when this is implemented (look at how it was done in vehicle)
// clientSchema.post('update', async function (document) {
//   if (this.isModified('deleted')) {
//     console.log(`deletion detected!`)
//     const vehicles = document.vehicles
//     console.log(`Vehicles: ${JSON.stringify(vehicles, null, 2)}`)
//     for (vehicle in vehicles) {
//       let vehicleObj = await Vehicle.findByIdAndUpdate(vehicle._id, {
//         deleted: true,
//       })
//       console.log(`vehicle: ${JSON.stringify(vehicleObj, null, 2)}`)
//       for (appointment in vehicleObj.appointments) {
//         const appointmentObj = await Appointment.findByIdAndUpdate(
//           appointment._id,
//           {
//             delete: true,
//           }
//         )
//         console.log(`AppointObj: ${JSON.stringify(appointObj, null, 2)}`)
//       }
//     }
//   }
// })

//static method to login user
clientSchema.statics.login = async function (email, password) {
  const client = await this.findOne({ email, deleted: false })
  if (client) {
    //const auth = await bcrypt.compare(password, client.password)
    //const auth = (await password) === client.password //old bcrypt version -> this line is thus depricated
    const auth = await bcryptjs.compare(password, client.password)
    if (auth) {
      return client
    }
    throw Error('Incorrect email or password')
  }
  throw Error('Incorrect email or password')
}

clientSchema.statics.addVehicle = async function (clientId, vehicle) {
  const client = await this.findById(clientId).exec()
  if (client) {
    client.vehicles.push(vehicle._id)
    console.log('Added new vehicle to client: ', vehicle)
    console.log('Client profile is now ', client)
    client.save()
  } else throw Error('Client not found')
}

const Client = mongoose.model('Client', clientSchema)
module.exports = Client
