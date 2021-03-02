const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CatalogService = require('./catalogService')

const catalogProduct = new Schema({
    name: {
        type: String,
        required: true,
        index: true //todo: unique?
    },
    garage_product_number: {
        type: String,
        index: true,
        unique: true
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
        //default: undefined
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CatalogService', //ref to the service
        default: undefined
    },
    sku: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })


const CatalogProduct = mongoose.model('CatalogProduct', catalogProduct)
module.exports = CatalogProduct