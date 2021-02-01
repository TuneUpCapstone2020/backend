const Appointment = require('../models/appointment')
const helpers = require('../helpers')
const Vehicle = require('../models/vehicle')
const Garage = require('../models/garage')
const Employee = require('../models/employee')
const Client = require('../models/client')
const _ = require('lodash')
const __ = require('underscore')
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
    final_price: '',
    employee_num: '',
    services: '',
    products: '',
    total_estimated_time: '',
    labour_time: '',
    client: '',
    discount: '',
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
/*
 * date: date object
 * skill level: highest int of highest service????
 * total_esimated_time: int of estimated time in minutes
 * garageId: String of garageid (just the characters, not the ObjectId(...))
 * client: string of client's id (formatted as above)
 */
const appoints_create = async (req, res) => {
  //the way creation is going to work, create the object in the db. Then
  //get the estimated time for all the services and assign it to the total_estimated_time
  //!THIS IS SUPER IMPORTANT
  let newAppointment = _.omitBy(req.body, _.isNil)
  newAppointment.garageId = await Garage.findById(newAppointment.garageId)
  newAppointment.client = await Client.findById(newAppointment.client)
  try {
    const appointment = await Appointment.create(newAppointment)
    console.log(
      `New appointment created for: ${
        appointment.date
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

/*
 * in query params we need:
 * appointDate: JS Date object This will indidicate when we want to look
 * appointLength: int of length of appointment stored in minutes
 * skill_level: skill level of the task
 * garageId: the ID of the garage where the client wants to make the appoint
 * preferredTime: a bool where 0 is AM and 1 is PM
 */
//todo: use getDay to determine if date provided is weekend or not. If weekend say nahhhhh
const appoints_get_availability_by_date = async (req, res) => {
  const garage = await Garage.findById(req.query.garageId)
  const date = new Date(req.query.appointDate)
  let timesThatWorkForClient = []
  let mechFreeAllDay = false
  let responseSent = false
  let totalAvailableTimes = []
  const qualifiedMechanics = await Employee.find({
    skill_level: req.query.skill_level,
    deleted: false,
  })
    .sort({ employee_number: 'ascending' })
    .exec()

  //qualifiedMechanics.forEach((mechanic) => {
  for (const mechanic of qualifiedMechanics) {
    // console.log(`Checking: ${mechanic.first_name}`)
    console.log(`mechFreeAllDay1: ${mechFreeAllDay}`)
    // if (mechFreeAllDay) {
    //   res.status(200).json(timesThatWorkForClient)
    //   break
    // }
    const times = []
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    await Appointment.find(
      {
        date: {
          $gte: date.toISOString(),
          $lt: nextDay.toISOString(),
        },
        employee_num: mechanic.employee_number,
        deleted: false,
        archived: false,
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
          //sloppy check to see if there has been a mech who is free all day
          // console.log(`Checking avails for day: ${result.date}`)
          if (mechFreeAllDay && !responseSent) {
            res.status(200).json(timesThatWorkForClient)
            responseSent = true
            return
          }
          // console.log(`Appointments: ${result}`)
          // console.log(`Appoints length: ${result.length}`)
          if (result.length > 1) {
            /* 
              In this if statement, there are multiple appointments in the day.
              We need to start by looking at the first appointment of the day
              and check if its starts when the garage opens or later. 
              If it starts later, we will check the time between it, and opening time
              If that time is >= the appoitnment length, then we will return all the possible
              times that that appointment can start. This case is covered in the next if statement
            */
            //*Check times between opening and first appointment
            if (result[0].date.getHours() > garage.opening_time / 60) {
              //time before = the hour that the first appointment starts (converted to minutes)
              // + the minutes that the appointment starts
              // - the opening time of the garage (stored in minutes).
              //This give the amount of minutes between opening time and the first appointment of the day
              const timeBefore =
                result[0].date.getHours() * 60 +
                result[0].date.getMinutes() -
                garage.opening_time

              //now, if that time is enough time to schedule the appointment, we see how many start times would work
              if (req.query.appointLength <= timeBefore) {
                //in this loop, we start at the opening time (i=0) and loop in 15 minute increments
                //the amount of valid time slots the appointment can start
                //ex: if garage opens at 8:30 and first appointment is at 9:45, we can book at 30 minute
                // appointment that starts at 8:30, 8:45, 9:00, or 9:15. we push these times to the times array
                for (
                  var i = 0;
                  i < timeBefore / timeBlockGranularity - 1;
                  i++
                ) {
                  const hours = Math.floor((i * timeBlockGranularity) / 60)
                  const minutes = i * timeBlockGranularity - 60 * hours
                  times.push({
                    date: new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      garage.opening_time / 60 + hours,
                      minutes
                    ),
                    employee: mechanic.employee_number,
                  })
                }
                console.log(`opening times: ${JSON.stringify(times, null, 2)}`)
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
              console.log(
                `endTimeOfAppoint: ${JSON.stringify(endTimeOfAppoint, null, 2)}`
              )
              console.log(
                `timeBetweenAppoints: ${JSON.parse(
                  timeBetweenAppoints,
                  null,
                  2
                )}`
              )
              const hourAppointEnds = Math.floor(endTimeOfAppoint / 60)
              const minuteAppointEnds = endTimeOfAppoint - hourAppointEnds * 60
              if (req.query.appointLength <= timeBetweenAppoints) {
                for (
                  var i = 0;
                  i < timeBetweenAppoints / timeBlockGranularity - 1;
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
              garage.closing_time -
              (result[result.length - 1].date.getHours() * 60 +
                result[result.length - 1].date.getMinutes() + //start time of last apt
                result[result.length - 1].total_estimated_time)
            if (timeUntilClose >= req.query.appointLength) {
              const hourOfLastAppointEnd = Math.floor(
                (result[result.length - 1].date.getHours() * 60 +
                  result[result.length - 1].date.getMinutes() + //start time of last apt
                  result[result.length - 1].total_estimated_time) /
                  60
              )
              for (
                var i = 0;
                i < timeUntilClose / timeBlockGranularity - 1;
                i++
              ) {
                const hours = Math.floor((i * timeBlockGranularity) / 60)
                const minutes = i * timeBlockGranularity - 60 * hours

                times.push({
                  date: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    hourOfLastAppointEnd + hours,
                    minutes
                  ),
                  employee: mechanic.employee_number,
                })
              }
              console.log(`end of day times: ${JSON.stringify(times, null, 2)}`)
            }
            totalAvailableTimes = totalAvailableTimes.concat(times)

            totalAvailableTimes = totalAvailableTimes.concat(times)
          } else if (result.length == 1) {
            console.log(
              `There is only one apointment for ${mechanic.first_name} today`
            )
            //*Check times between opening and appointment
            if (result[0].date.getHours() > garage.opening_time / 60) {
              //time before = the hour that the first appointment starts (converted to minutes)
              // + the minutes that the appointment starts
              // - the opening time of the garage (stored in minutes).
              //This give the amount of minutes between opening time and the first appointment of the day
              const timeBefore =
                result[0].date.getHours() * 60 +
                result[0].date.getMinutes() -
                garage.opening_time
              //now, if that time is enough time to schedule the appointment, we see how many start times would work
              if (req.query.appointLength <= timeBefore) {
                //in this loop, we start at the opening time (i=0) and loop in 15 minute increments
                //the amount of valid time slots the appointment can start
                //ex: if garage opens at 8:30 and first appointment is at 9:45, we can book at 30 minute
                // appointment that starts at 8:30, 8:45, 9:00, or 9:15. we push these times to the times array
                for (
                  var i = 0;
                  i < timeBefore / timeBlockGranularity - 1;
                  i++
                ) {
                  const hours = Math.floor((i * timeBlockGranularity) / 60)
                  const minutes = i * timeBlockGranularity - 60 * hours
                  times.push({
                    date: new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      garage.opening_time / 60 + hours,
                      minutes
                    ),
                    employee: mechanic.employee_number,
                  })
                }
                console.log(`Times: ${JSON.stringify(times)}`)
              }
            }

            //*check time between appointment, and closing time
            const timeUntilClose =
              garage.closing_time -
              (result[result.length - 1].date.getHours() * 60 +
                result[result.length - 1].date.getMinutes() + //start time of last apt
                result[result.length - 1].total_estimated_time)
            if (timeUntilClose >= req.query.appointLength) {
              const minutesBetweenLastAptAndEndOfDay =
                garage.closing_time -
                (result[result.length - 1].date.getHours() * 60 +
                  result[result.length - 1].date.getMinutes() + //start time of last apt
                  result[result.length - 1].total_estimated_time)

              const hourOfLastAppointEnd = Math.floor(
                (result[result.length - 1].date.getHours() * 60 +
                  result[result.length - 1].date.getMinutes() + //start time of last apt
                  result[result.length - 1].total_estimated_time) /
                  60
              )

              for (
                var i = 0;
                i < timeUntilClose / timeBlockGranularity - 1;
                i++
              ) {
                const hours = Math.floor((i * timeBlockGranularity) / 60)
                const minutes = i * timeBlockGranularity - 60 * hours

                times.push({
                  date: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    hourOfLastAppointEnd + hours,
                    minutes
                  ),
                  employee: mechanic.employee_number,
                })
              }
            }
            totalAvailableTimes = totalAvailableTimes.concat(times)
          } else {
            const freeMechTimes = []
            mechFreeAllDay = true
            //the mech has no appoints that day so give entire day
            const totalMinutesOfWorkDay =
              garage.closing_time - garage.opening_time
            for (
              var i = 0;
              i < totalMinutesOfWorkDay / timeBlockGranularity;
              i++
            ) {
              const hours = Math.floor((i * timeBlockGranularity) / 60)
              const minutes = i * timeBlockGranularity - 60 * hours
              freeMechTimes.push({
                date: new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                  garage.opening_time + hours,
                  minutes
                ),
                employee: mechanic.employee_number,
              })
            }

            for (const date of freeMechTimes) {
              //if hours >12, ampm==1, else == 2
              if (
                (date.date.getHours() >= 12 ? 1 : 0) == req.query.preferredTime
              ) {
                continue
              } //if pm
              timesThatWorkForClient.push(date)
            }
            if (timesThatWorkForClient.length > timeSlotsToReturn) {
              timesThatWorkForClient = __.initial(
                timesThatWorkForClient,
                timesThatWorkForClient.length - timeSlotsToReturn
              )
            }

            return
          }
        }
      }
    )
  } //)

  //*If there are no available appointments, then inform the client
  if (!totalAvailableTimes.length) {
    res.status(200).json({
      message: 'There is no room for that appointment today!',
    })
  }
  //check to make sure there wasn't a free mech.
  if (!responseSent) {
    //*Now that we have all the available times, we want to eliminate the ones that don't work for the client

    for (const date of totalAvailableTimes) {
      //if hours >12, ampm==1, else == 2
      if ((date.date.getHours() >= 12 ? 1 : 0) != req.query.preferredTime) {
        continue
      } //if pm
      timesThatWorkForClient.push(date)
    }
    console.log(
      `timesThatWorkForClient: ${JSON.stringify(timesThatWorkForClient)}`
    )

    //*Now we check if the array is empty. If it is, we recommend the closest appointment to the time
    //todo: test how the sort actually works
    if (!timesThatWorkForClient.length) {
      totalAvailableTimes.sort((a, b) => b.date - a.date) //!confirm it works the way we think it works
      console.log(
        `Sorted totalAvailableTimes: ${JSON.stringify(
          totalAvailableTimes,
          null,
          4
        )}`
      )
      if (req.query.preferredTime) {
        //if they want PM
        return res
          .status(200)
          .json(totalAvailableTimes[totalAvailableTimes.length - 1])
      } else {
        //they want am
        return res.status(200).json(totalAvailableTimes[0])
      }
    } else {
      //we have multiple available appoints
      if (timesThatWorkForClient.length > timeSlotsToReturn) {
        const timesToReturn = []
        for (var i = 0; i < timeSlotsToReturn; i++) {
          timesToReturn.push(timesThatWorkForClient[i])
        }
        // console.log(`timesThatWorkForClient: ${JSON.stringify(timesThatWorkForClient)}`)
        return res.status(200).json(timesToReturn)
      } else {
        return res.status(200).json(timesThatWorkForClient)
      }
    }
  }
}

//*Get free days of a month (needs month, appoint length, garage capacity )
/*
 * pass the following in the querry params:
 * firstDay: JS Date object of first day in range
 * lastDay: JS DAte object of last day in range
 * total_estimated_timed: the estimated time of the service/package
 * skill_level: int of the max required skill for services/package
 * garageId: the ID of the garage where the client is booking the appointment
 */
const appoints_get_free_days_of_week = async (req, res) => {
  try {
    //const freeDays = []
    const daysToVerifyAvail = []
    const tmpDate = new Date(req.query.firstDay)

    //build and array of all the days we awant to check
    for (let i = 0; i < 7; i++) {
      daysToVerifyAvail.push({
        date: tmpDate,
        available: false,
      })
      tmpDate.setDate(tmpDate.getDate() + 1)
    }
    const qualifiedMechanics = await Employee.find({
      skill_level: req.query.skill_level,
      deleted: false,
    })
      .sort({ employee_number: 'ascending' })
      .exec()

    for (const mechanic of qualifiedMechanics) {
      for (let i = 0; i < daysToVerifyAvail.length; i++) {
        if (daysToVerifyAvail[i].available == true) {
          continue
        }
        const upperLimitOfDateCheck = new Date(daysToVerifyAvail[i])
        upperLimitOfDateCheck.setDate(upperLimitOfDateCheck.getDate() + 1)

        await Appointment.find({
          date: {
            $gte: `${daysToVerifyAvail[i].getFullYear()}-${
              daysToVerifyAvail[i].getMonth() + 1
            }-${daysToVerifyAvail[i].getDate()}`,
            $lt: `${upperLimitOfDateCheck[i].getFullYear()}-${
              upperLimitOfDateCheck[i].getMonth() + 1
            }-${upperLimitOfDateCheck[i].getDate()}`,
          },
          employee_num: mechanic.employee_number,
          deleted: false,
          archived: false,
        }).sort({ employee_number: 'ascending' }, (err, result) => {
          if (err) {
            res.status(40).json({
              message: 'Unable to get appointments for this date',
              error: err.message,
            })
          }
          if (result.length === 0) {
            daysToVerifyAvail[i].available = true
            return
          } else if (result.length === 1) {
            //*check time between opening and appointment
            if (result[0].date.getHours() > garage.opening_time / 60) {
              const timeBefore =
                result[0].date.getHours() * 60 +
                result[0].date.getMinutes() -
                garage.opening_time
              if (timeBefore >= req.query.total_estimated_time) {
                daysToVerifyAvail[i].available = true
                return
              }
            }

            //*Check time between appoint and closing
            const timeUntilClose =
              garage.closing_time -
              (result[result.length - 1].date.getHours() * 60 +
                result[result.length - 1].date.getMinutes() + //start time of last apt
                result[result.length - 1].total_estimated_time)

            if (timeUntilClose >= req.query.total_estimated_time) {
              daysToVerifyAvail[i].available = true
              return
            }
          }
          //If there are multiple appoints
          else {
            //*check time between opening and appointment
            if (result.getHours() > garage.opening_time / 60) {
              const timeBefore =
                result.date.getHours() * 60 +
                result.date.getMinutes() -
                garage.opening_time
              if (timeBefore >= req.query.total_estimated_time) {
                daysToVerifyAvail[i].available = true
                return
              }
            }
            //*Check time between first appointment and next one
            for (var i = 0; i < result.length - 1; i++) {
              const timeBetweenAppoints =
                result[i + 1].date.getHours() * 60 -
                result[i + 1].date.getMinutes() - //start time of next apt in minutes
                result[i].date.getHours() * 60 + //end time of ith appointment
                result[i].date.getMinutes() +
                result[i].total_estimated_time

              if (req.query.appointLength <= timeBetweenAppoints) {
                daysToVerifyAvail[i].available = true
                return
              }
            }
            //*check time between last appointment of the day, and closing time
            const timeUntilClose =
              garage.closing_time -
              (result[result.length - 1].date.getHours() * 60 +
                result[result.length - 1].date.getMinutes() + //start time of last apt
                result[result.length - 1].total_estimated_time)
            if (timeUntilClose >= req.query.appointLength) {
              daysToVerifyAvail[i].available = true
              return
            }
          }
        })
      }
    }

    res.status(200).json(daysToVerifyAvail)
  } catch (err) {
    console.warn(
      `An error occurred in appoints_get_free_days_of_week @ time: ${helpers.getTimeStamp()}`
    )
    res.status(400).json({
      message: 'An error occured!',
      error: err.message,
    })
  }

  //we want to check for every mechanic if they have
}
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
        res.status(400).json({
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
        `Appointment ${
          result._id
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
const appoints_update_end_time = (req, res) => {}
//END: ENDPOINTS FOR PUT REQUESTS (Update)

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)
//todo: if day of cancellation is in the full day list of garage, remove from the list
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
          res.status(400).json({
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
    res.status(400).json({
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
  appoints_get_free_days_of_week,
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
