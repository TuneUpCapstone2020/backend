const mongoose = require('mongoose')
const { isEmail } = require('validator')
const Schema = mongoose.Schema

const employeeSchema = new Schema(
  {
    employee_number: {
      type: Number,
      required: [true, 'Please enter employee number'],
      index: true,
    },
    first_name: {
      type: String,
      required: [true, 'Please enter first name'],
      lowercase: true,
    },
    last_name: {
      type: String,
      required: [true, 'Please enter last name'],
      lowercase: true,
      index: true,
    },
    pwd: {
      type: String,
      required: [true, 'Please enter pwd'],
    },
    phone_number: {
      type: String,
      required: [true, 'Please enter phone number'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter email'],
      unique: true,
      lowercase: true,
      validate: [isEmail, 'Please enter valid email'],
    },
    address: {
      type: String,
      required: [true, 'Please enter address'],
    },
    wage: {
      type: Number,
      required: [true, 'Please enter wage'],
    },
    skill_level: {
      type: Number,
      required: [true, 'Please enter skill level'],
      index: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

employeeSchema.statics.login = async function (employee_number) {
  const employee = await this.findOne({ employee_number, deleted: false })
  if (employee) {
    const auth = (await employee_number) === employee.employee_number
    if (auth) {
      return employee
    }
    throw Error('Incorrect employee number')
  }
  throw Error('Incorrect employee number')
}

const Employee = mongoose.model('Employee', employeeSchema)
module.exports = Employee
