const mongoose = require('mongoose')
const Schema = mongoose.Schema

const catalogService = new Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    estimate: {
        type: Number, //price stored in cents
        required: true
    },
    skill_level: {
        type: Number, //enum corresponding to skill level
    }
})

const CatalogService = mongoose.model('CatalogService', catalogService)
module.exports = CatalogService