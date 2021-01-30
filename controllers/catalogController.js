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

    //duplicate errors
    if (err.code === 11000) {
        if (err.message.includes('garage_product_number'))
            errors.garage_product_number = 'That product number already exists!'
        if (err.message.includes('sku'))
            errors.sku = 'That SKU already exists!'
        return errors
    }
    //validation errors
    if (err.message.includes('CatalogProduct validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            if (properties !== undefined) {
                errors[properties.path] = properties.message
            }
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

    //duplicate errors
    if (err.code === 11000) {
        if (err.message.includes('garage_service_number'))
            errors.garage_service_number = 'That service number already exists!'
        return errors
    }

    //validation errors
    if (err.message.includes('CatalogService validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message
        })
    }

    return errors
}

//START: ENDPOINTS FOR POST REQUESTS (Create)

const catalog_product_create_new = async (req, res) => {
    const newProduct = req.body
    try {
        const product = await CatalogProduct.create(newProduct)
        res.status(201).json({
            message: 'New product created!',
            product: product._id
        })
    } catch (err) {
        const errors = handleProductErrors(err)
        res.status(400).json({ errors })
    }
}
const catalog_service_create_new = async (req, res) => {
    const newService = req.body
    try {
        const service = await CatalogService.create(newService)
        res.status(201).json({
            message: 'New service created!',
            service: service._id
        })
    } catch (err) {
        const errors = handleServiceErrors(err)
        res.status(400).json({ errors })
    }
}

//END: ENDPOINTS FOR POST REQUESTS

//START: ENDPOINTS FOR GET REQUESTS (Retrieve)
const catalog_product_get_all = (req, res) => {
    CatalogProduct.find({ deleted: false }).sort({ createdAt: -1 })
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(400).json({
                message: 'An error occured!',
                error: err
            })
        })
}
const catalog_product_get_by_name = (req, res) => {
    CatalogProduct.find({
        name: req.query.name,
        deleted: false
    })
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(400).json({
                message: 'An error occured!',
                error: err
            })
        })
}
const catalog_product_get_by_garage_product_number = (req, res) => {
    CatalogProduct.findOne({
        garage_product_number: req.query.garage_product_number,
        deleted: false
    })
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(400).json({
                message: 'An error occured!',
                error: err
            })
        })
}
const catalog_product_get_by_sku = (req, res) => {
    CatalogProduct.findOne({
        sku: req.query.sku,
        deleted: false
    })
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(400).json({
                message: 'An error occured!',
                error: err
            })
        })
}
const catalog_service_get_all = (req, res) => {
    CatalogService.find({ deleted: false })
        .sort({ createdAt: -1 })
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(400).json({
                message: 'An error occured!',
                error: err
            })
        })
}
const catalog_service_get_by_name = (req, res) => {
    CatalogService.find({
        name: req.query.name,
        deleted: false
    })
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(400).json({
                message: 'An error occured!',
                error: err
            })
        })
}
const catalog_service_get_by_service_number = (req, res) => {
    CatalogService.findOne({
        garage_service_number: req.query.garage_service_number,
        deleted: false
    })
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(400).json({
                message: 'An error occured!',
                error: err
            })
        })
}
//END: ENDPOINT FOR GET REQUESTS

//START: ENDPOINTS FOR PUT REQUESTS (Update)

const catalog_product_update = async (req, res) => {
    try {
        const product = await CatalogProduct.findById(req.body._id)

        product.name = req.body.name ? req.body.name : product.name
        product.garage_product_number = req.body.garage_product_number ? req.body.garage_product_number : product.garage_product_number
        product.cost_price = req.body.cost_price ? req.body.cost_price : product.cost_price
        product.sell_price = req.body.sell_price ? req.body.sell_price : product.sell_price
        product.description = req.body.description ? req.body.description : product.description
        product.service = req.body.service ? req.body.service : product.service
        product.sku = req.body.sku ? req.body.sku : product.sku

        product.save()
            .then((result) => {
                res.status(200).json({
                    message: 'Product updated!',
                    id: result._id
                })
            })
            .catch((err) => {
                res.status(400).json({
                    message: 'An error occured!',
                    error: err
                })
            })

    } catch (err) {
        res.status(400).json({
            message: 'An error occured',
            error: err
        })
    }


}
const catalog_service_update = async (req, res) => {
    try {
        const service = await CatalogService.findById(req.body._id)

        service.name = req.body.name ? req.body.name : service.name
        service.garage_service_number = req.body.garage_service_number ? req.body.garage_service_number : service.garage_service_number
        service.description = req.body.description ? req.body.description : service.description
        service.time_estimate = req.body.time_estimate ? req.body.time_estimate : service.time_estimate
        service.skill_level = req.body.skill_level ? req.body.skill_level : service.skill_level
        service.customer_note = req.body.customer_note ? req.body.customer_note : service.customer_note

        console.log(`service after: ${service}`)
        service.save()
            .then((result) => {
                res.status(200).json({
                    message: 'Service updated!',
                    id: result._id
                })
            })
            .catch((err) => {
                res.status(400).json({
                    message: 'An error occured!',
                    error: err
                })
            })

    } catch (err) {
        res.status(400).json({
            message: 'An error occured',
            error: err
        })
    }
}

//END: ENDPOINTS FOR PUT REQUESTS

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)
const catalog_product_delete = async (req, res) => {
    try {
        console.log(`id: ${req.query._id}`)
        const product = await CatalogProduct.findByIdAndUpdate(req.query._id, { deleted: true })
        product.save()
            .then((result) => {
                res.status(200).json({
                    message: 'Product deleted!',
                    id: result._id
                })
            })
            .catch((err) => {
                res.status(400).json({
                    message: 'An error occured!',
                    error: err
                })
            })
    } catch (err) {
        res.status(400).json({
            message: 'An error occured',
            error: err
        })
    }
}
const catalog_service_delete = async (req, res) => {
    try {
        const service = await CatalogService.findByIdAndUpdate(req.query._id, { deleted: true })
        service.save()
            .then((result) => {
                res.status(200).json({
                    message: 'Service deleted!',
                    id: result._id
                })
            })
            .catch((err) => {
                res.status(400).json({
                    message: 'An error occured!',
                    error: err
                })
            })
    } catch (err) {
        res.status(400).json({
            message: 'An error occured',
            error: err
        })
    }
}

module.exports = {
    catalog_product_create_new,
    catalog_service_create_new,
    catalog_product_get_all,
    catalog_product_get_by_name,
    catalog_product_get_by_garage_product_number,
    catalog_product_get_by_sku,
    catalog_service_get_all,
    catalog_service_get_by_name,
    catalog_service_get_by_service_number,
    catalog_product_update,
    catalog_service_update,
    catalog_product_delete,
    catalog_service_delete
}