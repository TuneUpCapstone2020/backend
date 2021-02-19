const mongoose = require('mongoose')
const Schema = mongoose.Schema

const logoSchema = new Schema({
  MakeId: {
    type: Number,
    index: true,
  },
  image: {
    date: Buffer,
    contentType: String,
  },
})

const CarLogo = mongoose.model(CarLogo, varlogoSchema)
module.exports = CarLogo
