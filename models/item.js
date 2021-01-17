const mongoose = require('mongoose')
const Schema = mongoose.Schema

const itemSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    costPrice: {
        type: Schema.Types.Decimal128,
        required: false
    },
    sellPrice: {
        type: Schema.Types.Decimal128,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    service: {
        type: Boolean,
        required: true
    },
    sku: {
        type: String,
        required: false
    },
    skillLevel: {
        type: Number,
        required: false
    },
    timeEstimate: {
        type: Schema.Types.Decimal128,
        required: false
    }
})

const Item = mongoose.model('Item', itemSchema)
module.exports = Item