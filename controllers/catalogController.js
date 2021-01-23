const CatalogProduct = require('../models/catalogProduct')
const CatalogService = require('../models/catalogService')

const handleProductErrors = (err) => {
    console.log(err.message, err.code)
    let errors = {
        name: '',
        garage_product_number: '',
        cost_price: '',
        sell_price: '',
        description: '',
        service: '',
        sku: ''
    }

    //validation errors
    if (err.message.includes('Product validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message
        })
    }

    return errors
}

const handleServiceErrors = (err) => {
    console.log(err.message, err.code)
    let errors = {
        name: '',
        garage_service_number: '',
        time_estimate: '',
        description: '',
        skill_level: '',
        customer_note: ''
    }

    //validation errors
    if (err.message.includes('Service validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message
        })
    }

    return errors
}

//START: ENDPOINTS FOR POST REQUESTS (Create)

const catalog_product_create_new = async (req, res) => {
    //const {name, garage_product_number, cost_price, sell_price, description, service, sku} = req.body
    const newProduct = req.body

    try {
        const product = await CatalogProduct.create(newProduct)
        res.status(201).json({ product: product._id })
    } catch (err) {
        const errors = handleProductErrors(err)
        res.status(400).json({ errors })
    }
}

const catalog_service_create_new = async (req, res) => {
    const newService = req.body
    try {
        const service = await CatalogService.create(newService)
        res.status(201).json({ service: service._id })
    } catch (error) {
        const errors = handleProductErrors(err)
        res.status(400).json({ errors })
    }
}

//END: ENDPOINTS FOR POST REQUESTS

//START: ENDPOINTS FOR GET REQUESTS (Retrieve)
const catalog_product_get_all = (req, res) => {
    CatalogProduct.find().sort({ createdAt: -1 })
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
const catalog_product_get_by_garage_product_number = (req, res) => {
    CatalogProduct.find({ 'garage_product_number': req.body.garage_product_number })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            res.send(`An error occured: ${err}`)
            throw err
        })
}
const catalog_product_get_by_sku = (req, res) => {
    CatalogProduct.find({ 'sku': req.body.sku })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            res.send(`An error occured: ${err}`)
            throw err
        })
}
const catalog_service_get_all = (req, res) => {
    CatalogService.find().sort({ createdAt: -1 })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            res.send(`An error occured: ${err}`)
            throw err
        })
}

const catalog_service_get_by_name = (req, res) => {
    CatalogService.find({ 'name': req.body.name })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            res.send(`An error occured: ${err}`)
            throw err
        })
}
const catalog_service_get_by_service_number = (req, res) => {
    CatalogService.find({ 'garage_service_number': req.body.garage_service_number })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            res.send(`An error occured: ${err}`)
            throw err
        })
}
//END: ENDPOINT FOR GET REQUESTS

//START: ENDPOINTS FOR PATCH REQUESTS (Update)

const catalog_product_update = async (req, res) => {
    try {
        const product = await CatalogProduct.findById(req.params._id)
    } catch (err) {
        res.status(400).send(`An error occured: ${err}`)
    }

    product.name = req.body

}

//END: ENDPOINTS FOR PATCH REQUESTS


//add product (with related service)
//add service
//search by others
//edit/update products and whatnot