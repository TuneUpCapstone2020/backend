const mongoose = require('mongoose')
const Schema = mongoose.Schema

const catalogProduct = new Schema({
    name: {
        type: String,
        required: true
    },
    cost_price: {
        type: Number, //price stored in cents
        required: true
    },
    sell_price: {
        type: Number, //price stored in cents
        required: true
    },
    description: {
        type: String,
        required: true
    },
    service: {
        type: Schema.Types.ObjectId, //ref to the service
        required: true
    },
    sku: {
        type: String,
        required: true
    }

})

const catalogService = new Schema({
    name: {
        type: String,
        required: true
    },
    estimate: {
        type: Number, //price stored in cents
        required: true
    },
    skill_level: {
        type: Number, //enum corresponding to skill level
    }
})

const CatalogProduct = mongoose.model('CatalogProduct', catalogProduct)
const CatalogService = mongoose.model('CatalogService', catalogService)
module.exports = CatalogProduct, CatalogService