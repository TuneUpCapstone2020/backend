const helper = require('../helpers')
const _ = require('lodash')

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
  let newPackage = _.omitBy(req.body, _.isNil)
  newPackage.garageId = await Garage.findById(newPackage.garageId)
  const services = []
  //for every service id, we must get the object
  for (serviceId of newPackage.servicesIds) {
    services.push(await CatalogService.findById(serviceId))
  }
  newPackage.services = services
}
