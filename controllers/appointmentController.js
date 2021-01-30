const Appointment = require('../models/appointment')
const helpers = require('../helpers')
const Vehicle = require('../models/vehicle')
const Garage = require('../models/garage')
const Employee = require('../models/employee')
const _ = require('lodash')
const { forEach } = require('lodash')
const minimumMechanicLevel = 4
const timeBlockGranularity = 30
const timeSlotsToReturn = 5
//START: Error Handlers
const handleErrors = (err) => {
  console.log(err.message, err.code)

  let errors = {
    date: '',
    start_time: '',
    end_time: '',
    skill_level: '',
    price: '',
    employee_num: '',
    services: '',
  }

  // Handle Duplicate errors
  //(none currently apply)
  if (err.code === 11000) {
  }

  //validation errors
  if (err.message.includes('Appointment validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      if (properties !== undefined) {
        errors[properties.path] = properties.message
      }
    })
  }

  return errors
}
//END: Error Handlers

//START: ENDPOINTS FOR POST REQUESTS (Create)
const appoints_create = async (req, res) => {
  //the way creation is going to work, create the object in the db. Then
  //get the estimated time for all the services and assign it to the total_estimated_time
  //!THIS IS SUPER IMPORTANT
  const newAppointment = req.body
  try {
    const appointment = await Appointment.create(newAppointment)
    console.log(
      `New appointment created for: ${appointment.date
      } @ time: ${helpers.getTimeStamp()}`
    )
    await Vehicle.addAppointment(req.query.vehicleId, appointment)
    res.status(201).json({
      message: 'New Appointment created!',
      appointment: appointment._id,
      date: appointment.date,
    })
  } catch (err) {
    const errors = handleErrors(err)
    console.warn(
      `An error occured in appointment_create @ time: ${helpers.getTimeStamp()}`
    )
    res.status(400).json({ errors })
  }
}
//END: ENDPOINTS FOR POST REQUESTS (Create)

//START: ENDPOINTS FOR GET REQUESTS (Retrieve)
const appoints_get_all = (req, res) => {
  Appointment.find({ deleted: false, archived: false })
    .sort({ createdAt: -1 })
    .then((result) => {
      console.log(
        `Get request of all appointments @ time: ${helpers.getTimeStamp()}`
      )
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in: appoints_get_all @ time: ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}
const appoints_get_one_by_id = (req, res) => {
  Appointment.findById(req.query._id, {
    deleted: false,
    archived: false,
  })
    .then((result) => {
      console.log(`Get appoint by id @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in: appoints_get_one_by_id @ time: ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}
//!Define date!
const appoints_get_by_date = (req, res) => {
  Appointment.find({
    date: req.query.date,
    deleted: false,
    archived: false,
  })
    .then((result) => {
      console.log(`Get appoint by date @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in: appoints_get_by_date @ ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}

//pass the length of the appoint, and the day (dd-mm-yyyy)
/*
 * in body we need:
 * appointDate: JS Date object This will indidicate when we want to look
 * appointLength: int of length of appointment stored in minutes
 * skill_level: skill level of the task
 * garageId: the ID of the garage where the client wants to make the appoint
 * preferredTime: a bool where 0 is AM and 1 is PM
 */
//todo: make sure there's enough mechanics (maybe even check their skill level appoint.service.skillLevel > mechleve)
const appoints_get_availability_by_date = async (req, res) => {
  const qualifiedMechanics = await Employee.find({
    skill_level: req.query.skill_level,
    deleted: false,
  })
    .sort({ employee_number: 'ascending' })
    .exec()
  const totalAvailableTimes = []

  //qualifiedMechanics.forEach((mechanic) => {
  for (const mechanic of qualifiedMechanics) {
    const times = []
    await Appointment.find(
      {
        day: req.query.appointDate,
        employee_num: mechanic.employee_number,
        deleted: false,
      },
      null,
      { sort: { date: 'ascending' } },
      async (err, result) => {
        if (err) {
          console.warn(
            `An error occured in appoints_get_availability_by_date @ time: ${helpers.getTimeStamp()}`
          )
          res.status(400).json({
            message: 'Unable to get appointments for the day!',
            error: err.message,
          })
        } else {
          if (result.length > 1) {
            date = req.query.appointDate
            const garage = await Garage.findById(result[0].garageId).exec()
            /* 
              In this if statement, there are multiple appointments in the day.
              We need to start by looking at the first appointment of the day
              and check if its starts when the garage opens or later. 
              If it starts later, we will check the time between it, and opening time
              If that time is >= the appoitnment length, then we will return all the possible
              times that that appointment can start. This case is covered in the next if statement
            */
            //*Check times between opening and first appointment
            if (result[0].date.getHours() > garage.getOpeningTime()) {
              //time before = the hour that the first appointment starts (converted to minutes)
              // + the minutes that the appointment starts
              // - the opening time of the garage (stored in minutes).
              //This give the amount of minutes between opening time and the first appointment of the day
              const timeBefore =
                result[0].date.getHours() * 60 +
                result[0].date.getMinutes() -
                garage.getOpeningTime()

              //now, if that time is enough time to schedule the appointment, we see how many start times would work
              if (req.query.appointLength <= timeBefore) {
                //in this loop, we start at the opening time (i=0) and loop in 15 minute increments
                //the amount of valid time slots the appointment can start
                //ex: if garage opens at 8:30 and first appointment is at 9:45, we can book at 30 minute
                // appointment that starts at 8:30, 8:45, 9:00, or 9:15. we push these times to the times array
                for (var i = 0; i < timeBefore / timeBlockGranularity; i++) {
                  const hours = Math.floor((i * timeBlockGranularity) / 60)
                  const minutes = i * timeBlockGranularity - 60 * hours
                  times.push({
                    date: new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      garage.getOpeningTime() / 60 + hours,
                      minutes
                    ),
                    employee: mechanic.employee_number,
                  })
                }
              }
            }
            //*Check remaining appointments except the last appointment of the day
            for (var i = 0; i < result.length - 1; i++) {
              const endTimeOfAppoint =
                result[i].date.getHours() * 60 +
                result[i].date.getMinutes() +
                result[i].total_estimated_time
              const timeBetweenAppoints =
                result[i + 1].date.getHours() * 60 -
                result[i + 1].date.getMinutes() - //start time of next apt in minutes
                endTimeOfAppoint

              const hourAppointEnds = Math.floor(endTimeOfAppoint / 60)
              const minuteAppointEnds = endTimeOfAppoint - hourAppointEnds * 60
              if (req.query.appointLength <= timeBetweenAppoints) {
                date = req.query.appointDate
                for (
                  var i = 0;
                  i < timeBetweenAppoints / timeBlockGranularity;
                  i++
                ) {
                  const hours = Math.floor((i * timeBlockGranularity) / 60)
                  const minutes = i * timeBlockGranularity - 60 * hours
                  times.push({
                    date: new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      hourAppointEnds + hours,
                      minuteAppointEnds + minutes
                    ),
                    employee: mechanic.employee_number,
                  })
                }
              }
            }
            //*check time between last appointment of the day, and closing time
            const timeUntilClose =
              garage.getClosingTime() -
              result[result.length - 1].date.getHours() * 60 -
              result[result.length - 1].date.getMinutes()
            if (timeUntilClose >= req.query.appointLength) {
              const minutesBetweenLastAptAndEndOfDay =
                garage.getClosingTime() -
                (result[result.length - 1].date.getHours() * 60 +
                  result[result.length - 1].date.getMinutes() + //start time of last apt
                  result[result.length - 1].total_estimated_time)

              const hourOfLastAppointEnd = Math.floor(
                minutesBetweenLastAptAndEndOfDay / 60
              )
              const minuteOfLastAppointEnd =
                minutesBetweenLastAptAndEndOfDay - hourOfLastAppointEnd * 60

              for (var i = 0; i < timeUntilClose / timeBlockGranularity; i++) {
                const hours = Math.floor((i * timeBlockGranularity) / 60)
                const minutes = i * timeBlockGranularity - 60 * hours
                times.push({
                  date: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    hourOfLastAppointEnd + hours,
                    minuteOfLastAppointEnd + minutes
                  ),
                  employee: mechanic.employee_number,
                })
              }
            }
            totalAvailableTimes = totalAvailableTimes.concat(times)
          } else if (result.length == 1) {
            //*Check times between opening and appointment
            if (result[0].date.getHours() > garage.getOpeningTime()) {
              //time before = the hour that the first appointment starts (converted to minutes)
              // + the minutes that the appointment starts
              // - the opening time of the garage (stored in minutes).
              //This give the amount of minutes between opening time and the first appointment of the day
              const timeBefore =
                result[0].date.getHours() * 60 +
                result[0].date.getMinutes() -
                garage.getOpeningTime()

              //now, if that time is enough time to schedule the appointment, we see how many start times would work
              if (req.query.appointLength <= timeBefore) {
                //in this loop, we start at the opening time (i=0) and loop in 15 minute increments
                //the amount of valid time slots the appointment can start
                //ex: if garage opens at 8:30 and first appointment is at 9:45, we can book at 30 minute
                // appointment that starts at 8:30, 8:45, 9:00, or 9:15. we push these times to the times array
                for (var i = 0; i < timeBefore / timeBlockGranularity; i++) {
                  const hours = Math.floor((i * timeBlockGranularity) / 60)
                  const minutes = i * timeBlockGranularity - 60 * hours
                  times.push({
                    date: new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      garage.getOpeningTime() / 60 + hours,
                      minutes
                    ),
                    employee: mechanic.employee_number,
                  })
                }
              }
            }

            //*check time between appointment, and closing time
            const timeUntilClose =
              garage.getClosingTime() -
              result[result.length - 1].date.getHours() * 60 -
              result[result.length - 1].date.getMinutes()
            if (timeUntilClose >= req.query.appointLength) {
              const minutesBetweenLastAptAndEndOfDay =
                garage.getClosingTime() -
                (result[result.length - 1].date.getHours() * 60 +
                  result[result.length - 1].date.getMinutes() + //start time of last apt
                  result[result.length - 1].total_estimated_time)

              const hourOfLastAppointEnd = Math.floor(
                minutesBetweenLastAptAndEndOfDay / 60
              )
              const minuteOfLastAppointEnd =
                minutesBetweenLastAptAndEndOfDay - hourOfLastAppointEnd * 60

              for (var i = 0; i < timeUntilClose / timeBlockGranularity; i++) {
                const hours = Math.floor((i * timeBlockGranularity) / 60)
                const minutes = i * timeBlockGranularity - 60 * hours
                times.push({
                  date: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    hourOfLastAppointEnd + hours,
                    minuteOfLastAppointEnd + minutes
                  ),
                  employee: mechanic.employee_number,
                })
              }
            }
            totalAvailableTimes = totalAvailableTimes.concat(times)
          } else {
            //the mech has no appoints that day so give entire day
            const totalMinutesOfWorkDay =
              garage.getClosingTime() - garage.getOpeningTime()
            for (
              var i = 0;
              i < totalMinutesOfWorkDay / timeBlockGranularity;
              i++
            ) {
              const hours = Math.floor((i * timeBlockGranularity) / 60)
              const minutes = i * timeBlockGranularity - 60 * hours
              times.push({
                date: new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                  garage.getOpeningTime() + hours,
                  garage.getOpeningTime() + minutes
                ),
                employee: mechanic.employee_number,
              })
            }
            //todo: eject the times the client doesn't want (AM/PM), if thats empty return earliest/closest appoint
            res.status(200).json(times) //?This should stop the loop, right?
          }
        }
      }
    )
  } //)
  //*Now that we have all the available times, we want to eliminate the ones that don't work for the client
  const timesThatWorkForClient = []
  // if(req.query.preferredTime){ //if client prefers am appoints
  totalAvailableTimes.forEach((date) => {
    //if hours >12, ampm==1, else == 2
    if ((date.getHours() >= 12 ? 1 : 0) == req.query.preferredTimes) {
      return
    } //if pm
    timesThatWorkForClient.push(date)
  })

  //*Now we check if the array is empty. If it is, we recommend the closest appointment to the time
  //todo: test how the sort actually works
  if (!timesThatWorkForClient.length) {
    totalAvailableTimes.sort((a, b) => b.date - a.date) //!confirm it works the way we think it works
    if (req.query.preferredTimes) {
      //if they want PM
      res.status(200).json(totalAvailableTimes[totalAvailableTimes.length - 1])
    } else {
      //they want am
      res.status(200).json(totalAvailableTimes[0])
    }
  } else {
    //we have multiple available appoints
    if (timesThatWorkForClient.length > timeSlotsToReturn) {
      const timesToReturn = []
      for (var i = 0; i < timeSlotsToReturn; i++) {
        timesToReturn.push(timesThatWorkForClient[i])
      }
      res.status(200).json(timesToReturn)
    } else {
      res.status(200).json(timesThatWorkForClient)
    }
  }
}

//*Get free days of a month (needs month, appoint length, garage capacity )
const appoints_get_free_days_of_month = (req, res) => { }
const appoints_get_by_employee = (req, res) => {
  Appointment.find({
    employee_num: req.query.employee_num,
    deleted: false,
    archived: false,
  })
    .then((result) => {
      console.log(`Get appoint by employee @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(result)
    })
    .catch((err) => {
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}
const appoints_get_by_client = (req, res) => {
  Appointment.find({
    client: req.query.client_id,
    deleted: false,
    archived: false,
  })
    .then((result) => {
      console.log(`Get appoint by user @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in appoints_get_by_user @ time: ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}
const appoints_get_by_date_and_employee = (req, res) => {
  Appointment.find({
    date: req.query.date,
    employee_num: req.query.employee_num,
    deleted: false,
    archived: false,
  })
    .then((result) => {
      console.log(
        `Get appoint by date and employee @ time: ${helpers.getTimeStamp()}`
      )
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in appoints_get_by_date_and_employee @ time: ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}
const appoints_get_by_date_and_client = (req, res) => {
  Appointment.find({
    date: req.query.date,
    client: req.query.client_id,
    deleted: false,
    archived: false,
  })
    .then((result) => {
      console.log(
        `Get appoint by date and client @ time: ${helpers.getTimeStamp()}`
      )
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in appoints_get_by_date_and_client @ time: ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}
const appoints_get_by_date_range = (req, res) => {
  Appointment.find({
    date: {
      $gt: req.query.lower_date,
      $lt: req.query.upper_date,
    },
    deleted: false,
    archived: false,
  })
    .then((result) => {
      console.log(
        `Get appoints by date range @ time: ${helpers.getTimeStamp()}`
      )
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in appoints_get_by_date_range @ time: ${helpers.getTimeStamp()}`
      )
    })
}
const archived_appoints_get_all = (req, res) => {
  Appointment.find({ deleted: false, archived: true })
    .sort({ createdAt: -1 })
    .then((result) => {
      console.log(
        `Get request of all archived appointments @ time: ${helpers.getTimeStamp()}`
      )
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in: appoints_get_all @ time: ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}
const archived_appoints_get_by_user = (req, res) => {
  Appointment.find({
    client: req.query.user_id,
    deleted: false,
    archived: true,
  })
    .then((result) => {
      console.log(`Archived GET by user @ time: ${helpers.getTimeStamp()}`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in archived_appoints_get_by_user @ time: ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'An error occured',
        error: err.message,
      })
    })
}
const archived_appoints_get_by_id = (req, res) => {
  Appointment.findById(req.query._id, {
    deleted: false,
    archived: true,
  })
    .then((result) => {
      console.log(
        `get archived appointment by id @ time: ${helpers.getTimeStamp()}`
      )
      res.status(201).json(result)
    })
    .catch((err) => {
      console.warn(
        `An error occured in archived_appoints_get_by_id @ time: ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'An error occured!',
        error: err.message,
      })
    })
}
//?Do I need to also get archied ones by date and employee??
//END: ENDPOINTS FOR GET REQUESTS (Retrieve)
//START: ENDPOINTS FOR PUT REQUESTS (Update)
//todo: re-calculate estimated appointment time
const appoints_update = async (req, res) => {
  try {
    const body = _.omitBy(req.body, _.isNil)
    await Appointment.findOneAndUpdate(body._id, body, (err, result) => {
      if (err) {
        console.warn(
          `An error occured in appoints_update @ time: ${helpers.getTimeStamp()}`
        )
        res.status(400).json({
          message: 'Unable to update appointment!',
          error: err.message,
        })
      } else {
        console.log(`Update appoint @ time: ${helpers.getTimeStamp()}`)
        res.status(200).json({
          message: 'Appointment updated!',
          appointment: result._id,
        })
      }
    })
  } catch (err) {
    console.warn(
      `An error occured in appoints_update @ time: ${helpers.getTimeStamp()}`
    )
    res.status(400).json({
      message: 'Unable to update appointment!',
      error: err.message,
    })
  }
}
const appoints_complete = async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.query._id,
    {
      archived: true,
      end_time: helpers.getTimeStamp(), //TODO: make sure this is the correct time format!!!!
      labour_time: req.body.labour_time,
    },
    (err, result) => {
      if (err) {
        console.warn(
          `An error occured in appoints_complete @ time: ${helpers.getTimeStamp()}`
        )
        req.status(400).json({
          message: 'Unable to mark appointment as complete!',
          error: err.message,
        })
      } else {
        console.log(
          `Appointment marked as complete @ time: ${helpers.getTimeStamp()}`
        )
        res.status(200).json({
          message: 'Appointment marked as complete!',
          id: result._id,
        })
      }
    }
  )
}
//?Is this needed???
const appoints_update_start_time = async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(req.query._id, {
    start_time: req.body.start_time,
  })
  appointment
    .save()
    .then((result) => {
      console.log(
        `Appointment ${result._id
        } start time updated @ time: ${helpers.getTimeStamp()}`
      )
      res.status(200).json({
        message: 'Appointment start time updated!',
        id: result._id,
      })
    })
    .catch((err) => {
      console.warn(
        `An error occurred in appoints_update_start_time @ time: ${helpers.getTimeStamp()}`
      )
      res.status(400).json({
        message: 'Unable to update start time!',
        error: err.message,
      })
    })
}
//? I dont think this is needed since we're updating the endtime when
//? we mark the appointment as complete
const appoints_update_end_time = (req, res) => { }
//END: ENDPOINTS FOR PUT REQUESTS (Update)

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)
const appoints_delete = async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(
      req.query._id,
      { deleted: true },
      (err, result) => {
        if (err) {
          console.warn(
            `An error occured in appoints_delete @ time: ${helpers.getTimeStamp()}`
          )
          req.status(400).json({
            message: 'Unable to delete appointment!',
            error: err.message,
          })
        } else {
          console.log(`Appointment deleted @ time: ${helpers.getTimeStamp()}`)
          res.status(200).json({
            message: 'Appointment deleted!',
            id: result._id,
          })
        }
      }
    )
  } catch (error) {
    console.warn(
      `An error occured in appoints_delete @ time: ${helpers.getTimeStamp()}`
    )
    req.status(400).json({
      message: 'Unable to delete appointment!',
      error: err.message,
    })
  }
}
//END: ENDPOINTS FOR DELETE REQUESTS (Delete)

module.exports = {
  //C
  appoints_create,
  //R
  appoints_get_all,
  appoints_get_by_date,
  appoints_get_by_employee,
  appoints_get_by_client,
  appoints_get_by_date_and_employee,
  appoints_get_by_date_and_client,
  appoints_get_by_date_range,
  appoints_get_one_by_id,
  appoints_get_availability_by_date,
  archived_appoints_get_all,
  archived_appoints_get_by_user,
  archived_appoints_get_by_id,
  //U
  appoints_update,
  appoints_complete,
  appoints_update_start_time,
  //D
  appoints_delete,
}

//ADD crud for packages
//get garage packages, update the packages, check if packages have changed (use modify date)
