const helper = require('../helpers')
const _ = require('lodash')
const Garage = require('../models/garage')
const CatalogService = require('../models/catalogService')

const handleErrors = (err) => {
  console.warn(
    `Error handler called in packageController @ time: ${helpers.getTimeStamp()}`
  )

  let errors = {
    name: '',
    starting_price: '',
    description: '',
  }

  // Handle Duplicate errors
  //(none currently apply)
  if (err.code === 11000) {
  }
  if (err.message.includes('Package validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      if (properties !== undefined) {
        errors[properties.path] = properties.message
      }
    })
  }

  return errors
}

//Create
/*
 * Body:
 *  garageId: String of id of the garage the package is for.
 *  name: string of name of the package
 *  starting_price: number of cents package starts at
 *  description: string of description of the package
 *  disclaimer: string of disclaimer of the package
 *  servicesIds: array of strings of objectIds of services
 *  servicesQuantity: the amount of a given service to include in package
        !important: the serviceId and serviceQuantity which are related to eachother
        !must have the same index in their own respective arrays
 *  published: boolean of if package is to be published immediately or not (true for yes, false for no)
*/
const package_create = async (req, res) => {
  //todo: make sure its not already in the db
  let newPackage = _.omitBy(req.body, _.isNil)
  newPackage.garageId = await Garage.findById(newPackage.garageId)
  const services = []
  //for every service id, we must get the object
  for (serviceId of newPackage.servicesIds) {
    services.push(await CatalogService.findById(serviceId))
  }
  newPackage.services = services
  try {
    const package = await Package.create(newPackage)
    console.log(`New package created at ${helper.getTimeStamp()}`)
    console.log(`New package id: ${package._id}`)
    res.status(201).json({
      message: `New package create!`,
      id: package._id,
    })
  } catch (err) {
    const errors = handleErrors(err)
    console.warn(
      `An error occured in package_create @ time: ${helpers.getTimeStamp()}`
    )
    console.log(`Error: ${err.message}`)
    res.status(400).json({
      message: `Unable to create package`,
      error: errors,
    })
  }
}

//Retrieve
const package_get_all = (req, res) => {
  Package.find({ delete: false })
    .sort({ createdAt: -1 })
    .then((package) => {
      console.log(`Get all packages @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(package)
    })
    .catch((err) => {
      console.warn(
        `An error occured in: package_get_all @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get all packages!',
        error: err.message,
      })
    })
}

const package_get_all_published = (req, res) => {
  Package.find({ delete: false, publish: true })
    .sort({ createdAt: -1 })
    .then((package) => {
      console.log(
        `Get all published packages @ time: ${helpers.getTimeStamp()}`
      )
      res.status(200).json(package)
    })
    .catch((err) => {
      console.warn(
        `An error occured in: package_get_all_published @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get all published packages!',
        error: err.message,
      })
    })
}

const package_get_all_unpublished = (req, res) => {
  Package.find({ delete: false, publish: false })
    .sort({ createdAt: -1 })
    .then((package) => {
      console.log(
        `Get all unpublished packages @ time: ${helpers.getTimeStamp()}`
      )
      res.status(200).json(package)
    })
    .catch((err) => {
      console.warn(
        `An error occured in: package_get_all_published @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get all unpublished packages!',
        error: err.message,
      })
    })
}

/*
 * Query params:
 *  garageId: Id of garage we want to get all the packages for
 */
const package_get_by_garage = (req, res) => {
  Package.find({ delete: false, garage: req.query.garageId })
    .then((packages) => {
      console.log(`Get packages by garage @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(packages)
    })
    .catch((err) => {
      console.warn(
        `Error occured in package_get_by_garage @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: `Unable to get packages`,
        error: err.message,
      })
    })
}

//In query params: name of package
//todo: consider looking into fuzzy search/search index or create manually with compass
const package_get_by_name = (req, res) => {
  Package.find({ delete: false, name: req.params.name })
    .then((packages) => {
      console.log(`Get packages by name @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json({ packages })
    })
    .catch((err) => {
      console.warn(
        `Error occured in package_get_by_name @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: `Unable to get packages by name!`,
        error: err.message,
      })
    })
}

//Update
/*
 * just store everything you want to update in the body. 
 * Send every other field as null or just don't send it maybe?
 ! Just make sure you pass the id of the package you want to update!
 */
const package_update = async (req, res) => {
  const body = _.omitBy(req.body, _.isNil)
  await Package.findOneAndUpdate(body._id, body, (err, result) => {
    if (err) {
      console.warn(
        `An error occured in package_update @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to update package!',
      })
    } else {
      console.log(`Package updated @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json({
        message: 'Package updated!',
        id: result._id,
      })
    }
  })
}

//send the id of the package in the query params(call it id), the status of publish will then be toggled
const package_publish_or_unpublish = async (req, res) => {
  try {
    let package = await Package.findbyid(req.query.id).catch((err) => {
      console.warn(
        `An error occured in package_publish_or_unpublish @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
    })
    package.published = !package.published
    package.save()
    res.status(20).json({
      message: `package has been updated to: ${package.publiched}`,
      id: package._id,
    })
  } catch (err) {
    console.warn(
      `An error occured in package_publish_or_unpublish @ time: ${helpers.getTimeStamp()}`
    )
    console.log(`Error: ${err.message}`)
    res.status(400).json({
      message: 'Unable to updated package!',
      error: err.message,
    })
  }
}

//Delete
//in query params:
// id: id of package to be deleted
const package_delete = async (req, res) => {
  try {
    await Package.findByIdAndUpdate(
      req.query.id,
      { deleted: true },
      (err, package) => {
        if (err) {
          console.warn(
            `An error occured in package_delete @ time: ${helpers.getTimeStamp()}`
          )
          console.log(`Error: ${err.message}`)
          res.status(400).json({
            message: 'Unable to delete package!',
            error: err.message,
          })
        } else {
          console.log(`Package deleted @ time: ${helpers.getTimeStamp()}`)
          res.status(200).json({
            message: 'Package deleted!',
            id: req.query.id,
          })
        }
      }
    )
  } catch (err) {
    console.warn(
      `An error occured in package_delete @ time: ${helpers.getTimeStamp()}`
    )
    console.log(`Error: ${err.message}`)
    res.status(400).json({
      message: 'Unable to delete package!',
      error: err.message,
    })
  }
}
