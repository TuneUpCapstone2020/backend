const ValetRoute = require('../models/valetRoute')
const Appointment = require('../models/appointment')
const _ = require('lodash')
const helpers = require('../helpers')

const nodeGeocoder = require('node-geocoder')
const options = { provider: 'openstreetmap' }
const geoCoder = nodeGeocoder(options)
//START: ENDPOINTS FOR CREATE

/*
 * In Body:
 *  coordinates: an array of the starting lat and long sent as [lat, long]
 * In query params:
 *  appointmentId: the id of the appointment the route will be associated to
 */
const route_create = async (req, res) => {
  const appointment = await Appointment.findById(req.query.appointmentId)
  let body = _.omitBy(req.body, _.isNil)
  await ValetRoute.create({
    appointment: appointment,
    // gps_coordinates: gps_coordinates,
    gps_coordinates: { coordinates: [body.coordinates[0]] },
    start_time: Date.now(),
  })
    .then((result) => {
      console.log(`Create new valet route @ time: ${helpers.getTimeStamp()}`)
      res.status(201).json({
        message: 'Create new valet route',
        id: result._id,
      })
    })
    .catch((err) => {
      console.warn(
        `An error occured in route_create! @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to create new route',
        error: err.message,
      })
    })
}

//END: create endpoints

//START: ENDPOINTS FOR REQUESTS
//in query params: routeId
const route_get_coordinates_by_route_id = async (req, res) => {
  await ValetRoute.findById(req.query.routeId)
    .then((route) => {
      console.log(`Getting valet route ${route._id}`)
      const coordinates = route.gps_coordinates.coordinates
      console.log(`Coordinates: ${coordinates}`)
      res.status(200).json(coordinates)
    })
    .catch((err) => {
      console.warn(
        `An error occured in route_get_coordinates_by_route_id @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get coordinates for this route',
        error: err.message,
        routeId: req.query.routeId,
      })
    })
}

//in query params: appointmentId
const route_get_coordinates_by_appointment_id = async (req, res) => {
  await ValetRoute.findOne({ appointment: req.query.appointmentId })
    .then((route) => {
      console.log(`Getting valet route by appointId ${route._id}`)
      const coordinates = route.gps_coordinates.coordinates
      res.status(200).json(coordinates)
    })
    .catch((err) => {
      console.warn(
        `An error occured in route_get_coordinates_by_appointment_id @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get coordinates for this route',
        error: err.message,
        routeId: req.query.appoitnmentId,
      })
    })
}

/*
 * In query params:
 *  address: address for which the lat and lon are required
 */
const route_get_lat_and_long_from_address = async (req, res) => {
  await geoCoder
    .geocode(req.query.address)
    .then((latAndLon) => {
      console.log(`latnlon: ${JSON.stringify(latAndLon, null, 2)}`)
      res.status(200).json({
        lat: latAndLon[0].latitude,
        lon: latAndLon[0].longitude,
      })
    })
    .catch((err) => {
      console.warn(
        `An error occured in route_get_lat_and_long_from_address @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'unable to get lat and lon from address!',
        error: err.message,
      })
    })
}

//end retrieve

//start update endpoints
/*
 * In query params:
 *  appoitnmentId: id of the appointment associated to the route we want to update
 * In body:
 *  coordinates: an array of arrays, where the inner arrays are all the new coordinates
 */
const route_add_point_by_appointment_id = async (req, res) => {
  await ValetRoute.findOne({ appointment: req.query.appointmentId })
    .then((route) => {
      if (route) {
        const newCoords = req.body.coordinates
        for (coordinate of newCoords) {
          route.gps_coordinates.coordinates.push(coordinate)
        }
        route.save()
        res.status(200).json({ message: 'updated coordinates!' })
      } else {
        res.status(400).json({ message: 'Unable to find that route' })
      }
    })
    .catch((err) => {
      console.warn(
        `An error occured in route_add_point_by_appointment_id @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
    })
}

//send appointmentId in query params
const route_end_valet_trip_by_appointment_id = async (req, res) => {
  await ValetRoute.findOneAndUpdate(
    { appointment: req.query.appointmentId },
    { trip_end_time: Date.now() },
    (err, result) => {
      if (err) {
        console.warn(
          `An error occured in route_end_valet_trip_by_appointment_id @ time: ${helpers.getTimeStamp()}`
        )
        console.log(`Error: ${err.message}`)
        res.status(400).json({
          message: 'An error occurred while ending the trip. Please try again!',
          error: err.message,
        })
      }
      {
        res.status(200).json({
          message: 'Route Completed!',
          end_time: result.trip_end_time,
          route_id: result._id,
        })
      }
    }
  )
}
module.exports = {
  route_create,
  route_get_coordinates_by_route_id,
  route_get_coordinates_by_appointment_id,
  route_get_lat_and_long_from_address,
  route_add_point_by_appointment_id,
  route_end_valet_trip_by_appointment_id,
}
