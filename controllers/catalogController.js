const CatalogProduct = require('../models/catalogProduct')
const CatalogService = require('../models/catalogService')

const catalog_product_index = (req, res) => {
    CatalogProduct.find().sort({ createdAt: -1 })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            res.send(`An error occured: ${err}`)
            throw err
        })
}

const catalog_service_index = (req, res) => {
    CatalogService.find().sort({ createdAt: -1 })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            res.send(`An error occured: ${err}`)
            throw err
        })
}

const catalog_product_get_by_name = (req, res) => {
    CatalogProduct.find({ 'name': req.body.name })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            res.send(`An error occured: ${err}`)
            throw err
        })
}

const catalog_service_get_by_name = (req, res) => {
    CatalogService.find({ 'name': req.body.nane })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            res.send(`An error occured: ${err}`)
            throw err
        })
}