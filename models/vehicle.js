const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Appointment = require('./appointment')

const vehicleSchema = new Schema(
  {
    make: {
      type: String,
      required: [true, 'Please enter make'],
    },
    model: {
      type: String,
      required: [true, 'Please enter model'],
    },
    nickname: {
      type: String,
    },
    license: {
      type: String,
      required: [true, 'Please enter license plate'],
      unique: true,
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Please enter year'],
    },
    mileage: {
      type: Number,
      required: [true, 'Please enter mileage'],
    },
    vin_number: {
      type: String,
      //unique: true
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    appointments: [
      {
        appointment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Appointment',
        },
      },
    ],
    health_attributes: [
      {
        attribute: {
          type: String,
          default: undefined,
        },
        status: {
          type: Number,
          default: 3,
        },
        attribute_applicable_to_vehicle: {
          type: Boolean,
          default: true,
        },
        system: {
          type: String,
          default: undefined,
        },
        inspection_tier: {
          type: Number,
          default: 2,
        },
        attribute_image_url: {
          type: String,
          default: undefined,
        },
      },
    ],
    health_attributes_summary: {
      type: String,
      default: undefined,
    },
    latest_insepction_tier: {
      type: Number,
      default: 2,
    },
  },
  { timestamps: true }
)

// vehicleSchema.pre('findOneAndUpdate', function (next) {
//   console.log(`1`)
//   this.wasMofidied = this.isModified('deleted')
//   console.log(`2`)
//   next()
// })
vehicleSchema.post('findOneAndUpdate', async function (document) {
  // console.log(`update called!`)
  // console.log(`document: ${JSON.stringify(document, null, 2)}`)
  // console.dir(`this: ${this.model}`, 4)
  // // if (this.Modified('deleted')) {
  // if (document.deleted == this.model.deleted) {
  //   console.log(`modified!!!!`)
  // }
  if (document.deleted) {
    const appoints = document.appointments
    //console.log(`appoints: ${JSON.stringify(appoints, null, 2)}`)
    for (appoint of appoints) {
      //console.log(`appoint.id: ${appoint._id}`)
      await Appointment.findByIdAndUpdate(appoint._id, { deleted: true })
    }
  }
  //next()
})

vehicleSchema.statics.addAppointment = async function (vehicleId, appointment) {
  const vehicle = await this.findById(vehicleId).exec()
  if (vehicle) {
    vehicle.appointments.push(appointment._id)
    console.log(`Added new appointment to vehicle: ${appointment._id}`)
    vehicle.save()
  } else throw Error('Vehicle not found')
}

vehicleSchema.pre('save', async function (next) {
  if (this.health_attributes.length == 0) {
    // console.log(
    //   `Populating vehicle attributes @ time: ${helpers.getTimeStamp()}`
    // )
    //const vehicle = await Vehicle.findById(this._id)
    const attributes = require('../attributes.json')

    for (attribute of attributes) {
      this.health_attributes.push(attribute)
    }
    // console.log(
    //   `Done populating vehicle attributes @ time: ${helpers.getTimeStamp()}`
    // )
  }
  next()
})

const Vehicle = mongoose.model('Vehicle', vehicleSchema)
module.exports = Vehicle
