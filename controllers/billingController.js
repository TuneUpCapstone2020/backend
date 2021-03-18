const helpers = require('../helpers')
const Client = require('../models/client')
const Vehicle = require('../models/vehicle')
const Appointment = require('../models/appointment')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

//Start Request
const generate_all_bills_for_client = async (req, res) => {
  //need make model dat service final price
  //second page needs complete cost breakdown
  const token = helpers.getDecodedToken(req)
  const client = token
    ? await Client.findById(token.id)
    : await Client.findById(req.query.clientId)
  console.log(`Start: ${process.hrtime()}`)
  await Client.aggregate([
    {
      $lookup: {
        from: 'vehicles',
        localField: 'vehicles._id',
        foreignField: '_id',
        as: 'vehicleList',
      },
    },
    {
      $unwind: {
        path: '$vehicleList',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $match: {
        'vehicleList.deleted': false,
      },
    },
    {
      $lookup: {
        from: 'appointments',
        localField: 'vehicleList.appointments._id',
        foreignField: '_id',
        as: 'appointmentList',
      },
    },
    {
      $unwind: {
        path: '$appointmentList',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $match: {
        'appointmentList.deleted': false,
        'appointmentList.archived': true,
        'appointmentList.client': ObjectId(client._id), //double check
      },
    },
    {
      $lookup: {
        from: 'catalogservices',
        localField: 'appointmentList.services.service',
        foreignField: '_id',
        as: 'servicesList',
      },
    },
    {
      $lookup: {
        from: 'catalogproduct',
        localField: 'appointmentList.products.product',
        foreignField: '_id',
        as: 'productList',
      },
    },
  ]).exec((err, appointments) => {
    if (err) {
      helpers.printError(err, 'generate_all_bills_for_client')
      res.status(400).json({
        message: 'Unable to get bills',
        error: err.message,
      })
    } else {
      const appointsWithDetailsToReturn = []
      for (appointment of appointments) {
        const arrayOfServiceNames = []
        const arrayOfProducts = []
        for (service of appointment.servicesList) {
          arrayOfServiceNames.push(service.name)
        }
        for (product of appointment.productList) {
          arrayOfProducts.push(product.name)
        }

        appointsWithDetailsToReturn.push({
          appointmentId: appointment.appointmentList._id,
          vehicleId: appointment.vehicleList._id,
          make: appointment.vehicleList.make,
          model: appointment.vehicleList.model,
          date: appointment.appointmentList.date,
          services: arrayOfServiceNames,
          finalPrice: appointment.appointmentList.final_price,
        })
      }
      res.status(200).json(appointsWithDetailsToReturn)
    }
  })
  console.log(`End: ${process.hrtime()}`)
  // console.log(`Appointments: ${JSON.stringify(appointments, null, 2)}`)

  // res.status(200).json(appointsWithDetailsToReturn)
}

//send appoitnmentId in query params
const generate_appointment_cost_breakdown = async (req, res) => {
  await Appointment.aggregate([
    {
      $match: {
        _id: ObjectId(req.query.appointmentId),
      },
    },
    {
      $lookup: {
        from: 'catalogservices',
        localField: 'services.service',
        foreignField: '_id',
        as: 'catalogServices',
      },
    },
    {
      $lookup: {
        from: 'catalogproducts',
        localField: 'products.product',
        foreignField: '_id',
        as: 'catalogProducts',
      },
    },
  ]).exec((err, appointment) => {
    if (err) {
      helpers.printError(err, 'generate_appointment_cost_breakdown')
      res.status(400).json({
        message: 'unable to get bill details',
        error: err.message,
      })
    } else {
      const productInfoToReturn = []
      const serviceInfoToReturn = []
      for (product of appointment.catalogProducts) {
        productInfoToReturn.push({
          name: product.name,
          price: product.sell_price,
        })
      }
      for (service of appointment.catalogServices) {
        serviceInfoToReturn.push({
          name: service.name,
          price: service.price,
        })
      }

      res.status(200).json({
        products: productInfoToReturn,
        services: serviceInfoToReturn,
        labour: appointment.labour_time,
        final_price: appointment.final_price,
      })

      //final cost = total_labour+services+products
    }
  })
}
module.exports = {
  generate_all_bills_for_client,
  generate_appointment_cost_breakdown,
}
