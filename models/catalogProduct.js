const mongoose = require('mongoose')
const Schema = mongoose.Schema

const catalogProduct = new Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    garage_product_number: {
        type: String,
        index: true
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
    },
    service: {
        type: Schema.Types.ObjectId, //ref to the service
    },
    sku: {
        type: String,
        required: true,
        index: true
    }
})

const CatalogProduct = mongoose.model('CatalogProduct', catalogProduct)
module.exports = CatalogProduct