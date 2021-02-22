const Appointment = require('../models/appointment')
const helpers = require('../helpers')
const Vehicle = require('../models/vehicle')
const Garage = require('../models/garage')
const Employee = require('../models/employee')
const Client = require('../models/client')
const Package = require('../models/package')
const _ = require('lodash')
const __ = require('underscore')
const { forEach } = require('lodash')
const minimumMechanicLevel = 4
const timeBlockGranularity = 30
const timeSlotsToReturn = 5
//START: Error Handlers
const handleErrors = (err) => {
  console.warn(err.message, err.code)

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
 * body:
 *  date: date object
 *  packageId: the Id of the chosen package. 
 *  employee_num: employee which the appoint is assigned to
 *  valet_required: 0 for no, 1 for yes
 *  customer_note: the user's message describing the issue
 //  skill level: highest int of highest service????
 //  total_esimated_time: int of estimated time in minutes
 //  garageId: String of garageid (just the characters, not the ObjectId(...))
 //  client: string of client's id (formatted as above)
 * Query params:
 *  vehicleId: Id of the vehicle the appointment is for
 */
const appoints_create = async (req, res) => {
  //todo: check the entire duration of the appointment, not just the start time.
  //first, we want to make sure that the appointment doesn't already exist
  //for that date and time with the given mechanic.
  if (
    (
      await Appointment.find({
        deleted: false,
        date: new Date(req.body.date),
        employee_num: req.body.employee_num,
      })
    ).length
  ) {
    console.log(
      `Attempted duplicate appointment made @time: ${helpers.getTimeStamp()}`
    )
    return res.status(400).json({
      message:
        'Appointment already exists with that mechanic. Please chose another time.',
    })
  }

  //start by getting the clientId from the header
  const token = helpers.getDecodedToken(req)

  //now, we want to get an array of all the services which are included in the package.
  const package = await Package.findById(req.body.packageId)
  //console.log(`package.garage: ${JSON.stringify(package.garage, null, 2)}`)
  let services = []
  for (let i = 0; i < package.services.length; i++) {
    services.push({
      service: package.services[i].service,
      quantity: package.services[i].quantity,
    })
  }
  //console.log(`services: ${JSON.stringify(services)}`)

  //console.log(`body: ${JSON.stringify(req.body)}`)
  let newAppointment = _.omitBy(req.body, _.isNil)
  newAppointment.client = await Client.findById(token.id)
  newAppointment.date = new Date(newAppointment.date)
  const garage = await Garage.findById(package.garage)
  newAppointment['garageId'] = garage
  newAppointment['services'] = services
  newAppointment['total_estimated_time'] = package.total_estimated_time
  newAppointment['skill_level'] = package.skill_level
  newAppointment['description'] =
    newAppointment.date.toISOString() +
    ';' +
    garage.name +
    ';' +
    package.name +
    ';' +
    package.starting_price +
    ';' +
    package.total_estimated_time
  console.log(`desc: ${newAppointment.description}`)
  //console.log(`package ${package}`)
  //console.log(`newAppointment: ${JSON.stringify(newAppointment, null, 2)}`)

  try {
    const appointment = await Appointment.create(newAppointment)
    //console.log(`Appointment: ${JSON.stringify(appointment, null, 2)}`)
    console.log(
      `New appointment created for: ${
        appointment.date
      } @ time: ${helpers.getTimeStamp()}`
    )
    await Vehicle.addAppointment(req.query.vehicleId, appointment)
    //add to response:
    //date, garage name, package name, estiated price, estimated time,
    res.status(201).json(appointment)
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
//Date should be sent as "yyyy-mm-dd" or as JavaScript date object style
const appoints_get_by_date = (req, res) => {
  date = new Date(req.query.date)
  nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + 1)
  Appointment.find({
    date: {
      $gte: date.toISOString(),
      $lt: nextDate.toISOString(),
    },
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
 * packageId: Id of the package the client is booking an appoitnment for
 // appointLength: int of length of appointment stored in minutes
 // skill_level: skill level of the task
 // garageId: the ID of the garage where the client wants to make the appoint
 * preferredTime: a bool where 0 is AM and 1 is PM
 */
//todo: use getDay to determine if date provided is weekend or not. If weekend say nahhhhh
const appoints_get_availability_by_date = async (req, res) => {
  const package = await Package.findById(req.query.packageId)
  const garage = await Garage.findById(package.garage)
  const date = new Date(req.query.appointDate)

  // const garage = await Garage.findById(req.query.garageId)
  // const date = new Date(req.query.appointDate)
  const appointLength = package.total_estimated_time
  let timesThatWorkForClient = []
  let mechFreeAllDay = false
  let responseSent = false
  let totalAvailableTimes = []
  console.log(
    `Getting appointments for ${date.toISOString()} @ time: ${helpers.getTimeStamp()}`
  )
  const qualifiedMechanics = await Employee.find({
    //skill_level: req.query.skill_level,
    skill_level: package.skill_level,
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
    //console.log(`date: ${date}`)
    nextDay.setDate(nextDay.getDate() + 1)

    if (responseSent) return
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
          //console.log(`date: ${date}`)

          //sloppy check to see if there has been a mech who is free all day
          // console.log(`Checking avails for day: ${result.date}`)
          if (mechFreeAllDay && !responseSent) {
            responseSent = true
            //console.log(`sending response`);
            return res.status(200).json(timesThatWorkForClient)
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
              if (appointLength <= timeBefore) {
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
              if (appointLength <= timeBetweenAppoints) {
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
            if (timeUntilClose >= appointLength) {
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
              if (appointLength <= timeBefore) {
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
            if (timeUntilClose >= appointLength) {
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
            //console.log(`date: ${date}`)

            const freeMechTimes = []
            mechFreeAllDay = true
            console.log(`mechfree: ${mechFreeAllDay}`)
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
              // console.log(`hours: ${hours},
              //   minutes: ${minutes}`)
              //console.log(`date: ${date}`)
              // console.log(
              //   `date2: ${new Date(
              //     date.getFullYear(),
              //     date.getMonth(),
              //     date.getDate(),
              //     garage.opening_time / 60 + hours,
              //     minutes
              //   )}`
              // )

              freeMechTimes.push({
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
            // console.log(
            //   `freeMechTimes: ${JSON.stringify(freeMechTimes, null, 2)}`
            // )
            for (const time of freeMechTimes) {
              //if hours >12, ampm==1, else == 2
              if (
                (time.date.getHours() >= 12 ? 0 : 1) == req.query.preferredTime
              ) {
                continue
              } //if pm
              timesThatWorkForClient.push(time)
            }
            if (timesThatWorkForClient.length > timeSlotsToReturn) {
              timesThatWorkForClient = __.initial(
                timesThatWorkForClient,
                timesThatWorkForClient.length - timeSlotsToReturn
              )
            }

            if (!responseSent) {
              //console.log(`response sent 2`);
              responseSent = true
              return res.status(200).json(timesThatWorkForClient)
            }
          }
        }
      }
    )
  } //)

  //*If there are no available appointments, then inform the client
  if (!totalAvailableTimes.length && !timesThatWorkForClient.length) {
    //console.log(`response 3`);
    responseSent = true
    return res.status(200).json([
      {
        message: 'There is no room for that appointment today!',
      },
    ])
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
        //console.log(`response 4`);
        return res
          .status(200)
          .json([totalAvailableTimes[totalAvailableTimes.length - 1]])
      } else {
        //they want am
        //console.log(`response 5`);
        return res.status(200).json([totalAvailableTimes[0]])
      }
    } else {
      //we have multiple available appoints
      if (timesThatWorkForClient.length > timeSlotsToReturn) {
        const timesToReturn = []
        for (var i = 0; i < timeSlotsToReturn; i++) {
          timesToReturn.push(timesThatWorkForClient[i])
        }
        // console.log(`timesThatWorkForClient: ${JSON.stringify(timesThatWorkForClient)}`)
        //console.log(`response 6`);
        return res.status(200).json(timesToReturn)
      } else {
        //console.log(`response 7`);
        return res.status(200).json(timesThatWorkForClient)
      }
    }
  }
}

//*Get free days of a month (needs month, appoint length, garage capacity )
/*
 * pass the following in the querry params:
 * firstDay: JS Date object of first day in range
 // lastDay: JS DAte object of last day in range
 * total_estimated_timed: the estimated time of the service/package
 * skill_level: int of the max required skill for services/package
 * garageId: the ID of the garage where the client is booking the appointment
 */
//todo: if there are to avails in the seven days, look either for a month, another week, or until an avail comes up
const appoints_get_free_days_of_week = async (req, res) => {
  try {
    const garage = Garage.findById({ _id: req.query.garageId, delete: false })
    const daysToVerifyAvail = []
    const tmpDate = new Date(req.query.firstDay)
    //console.log(`tmpDate: ${tmpDate}`)

    //build and array of all the days we awant to check
    for (let i = 0; i < 7; i++) {
      daysToVerifyAvail.push({
        date: tmpDate.toISOString(),
        available: false,
      })
      // console.log(`tmpDate2: ${tmpDate}`)
      // console.log(`avail: ${JSON.stringify(daysToVerifyAvail[i], null, 2)}`)
      //console.log(`wholeArray: ${JSON.stringify(daysToVerifyAvail, null, 2)}`)
      tmpDate.setDate(tmpDate.getDate() + 1)
    }
    //console.log(`wholeArray: ${JSON.stringify(daysToVerifyAvail, null, 2)}`)

    const qualifiedMechanics = await Employee.find({
      skill_level: req.query.skill_level,
      deleted: false,
    })
      .sort({ employee_number: 'ascending' })
      .exec()
    //console.log(`days: ${JSON.stringify(daysToVerifyAvail)}`)
    console.log(`mech length: ${qualifiedMechanics.length}`)
    for (const mechanic of qualifiedMechanics) {
      for (let i = 0; i < daysToVerifyAvail.length; i++) {
        console.log(`i: ${i}`)
        if (daysToVerifyAvail[i].available == true) {
          continue
        }
        const upperLimitOfDateCheck = new Date(daysToVerifyAvail[i].date)
        upperLimitOfDateCheck.setDate(upperLimitOfDateCheck.getDate() + 1)
        // console.log(`date1: ${daysToVerifyAvail[i].date}`)
        // console.log(`date2: ${upperLimitOfDateCheck}`)
        // console.log(`employee: ${mechanic.employee_number}`)

        const result = await Appointment.find({
          date: {
            // $gte: `${daysToVerifyAvail[i][0].date.getFullYear()}-${
            //   daysToVerifyAvail[i][0].date.getMonth() + 1
            // }-${daysToVerifyAvail[i][0].date.getDate()}`,
            $gte: daysToVerifyAvail[i].date,
            // $lt: `${upperLimitOfDateCheck.getFullYear()}-${
            //   upperLimitOfDateCheck.getMonth() + 1
            // }-${upperLimitOfDateCheck.getDate()}`,
            $lt: upperLimitOfDateCheck,
          },
          employee_num: mechanic.employee_number,
          deleted: false,
          archived: false,
        })
          .sort({ employee_number: 'ascending' })
          .exec()
        console.log(`result: ${result}`)
        console.log(`result length: ${result.length}`)
        if (result.length === 0) {
          console.log(`daysTo: ${JSON.stringify(daysToVerifyAvail)}`)
          console.log(`true1`)
          console.log(`i: ${i}`)
          console.log(`day: ${daysToVerifyAvail[i].date}`)
          console.log(`avail? ${daysToVerifyAvail[i].available}`)
          daysToVerifyAvail[i].available = true
          continue
        } else if (result.length === 1) {
          //*check time between opening and appointment
          if (result[0].date.getHours() > garage.opening_time / 60) {
            const timeBefore =
              result[0].date.getHours() * 60 +
              result[0].date.getMinutes() -
              garage.opening_time
            console.log(`timeBefore1: ${timeBefore}`)
            if (timeBefore >= req.query.total_estimated_time) {
              daysToVerifyAvail[i].available = true
              console.log(`true2`)
              continue
            }
          }

          //*Check time between appoint and closing
          const timeUntilClose =
            garage.closing_time -
            (result[result.length - 1].date.getHours() * 60 +
              result[result.length - 1].date.getMinutes() + //start time of last apt
              result[result.length - 1].total_estimated_time)
          console.log(`timeUntilClose1 ${timeUntilClose}`)
          if (timeUntilClose >= req.query.total_estimated_time) {
            daysToVerifyAvail[i].available = true
            console.log(`true3`)
            continue
          }
        }
        //If there are multiple appoints
        else {
          //*check time between opening and appointment
          if (result[0].date.getHours() > garage.opening_time / 60) {
            const timeBefore =
              result[0].date.getHours() * 60 +
              result[0].date.getMinutes() -
              garage.opening_time
            console.log(`timebefore2: ${timeBefore}`)
            if (timeBefore >= req.query.total_estimated_time) {
              daysToVerifyAvail[i].available = true
              console.log(`true4`)
              continue
            }
          }
          //*Check time between first appointment and next one
          for (let j = 0; j < result.length - 1; j++) {
            const timeBetweenAppoints =
              result[j + 1].date.getHours() * 60 -
              result[j + 1].date.getMinutes() - //start time of next apt in minutes
              result[j].date.getHours() * 60 + //end time of ith appointment
              result[j].date.getMinutes() +
              result[j].total_estimated_time
            console.log(`timebetweenappoints: ${timeBetweenAppoints}`)

            if (req.query.appointLength <= timeBetweenAppoints) {
              daysToVerifyAvail[i].available = true
              console.log(`true5`)
              continue
            }
          }
          //*check time between last appointment of the day, and closing time
          const timeUntilClose =
            garage.closing_time -
            (result[result.length - 1].date.getHours() * 60 +
              result[result.length - 1].date.getMinutes() + //start time of last apt
              result[result.length - 1].total_estimated_time)
          console.log(`timeuntilclose2: ${timeUntilClose}`)
          if (timeUntilClose >= req.query.appointLength) {
            daysToVerifyAvail[i].available = true
            console.log(`true6`)
            continue
          }
        }
        console.log(`nothing found!`)
        //}
        /* await Appointment.find(
          {
            date: {
              // $gte: `${daysToVerifyAvail[i][0].date.getFullYear()}-${
              //   daysToVerifyAvail[i][0].date.getMonth() + 1
              // }-${daysToVerifyAvail[i][0].date.getDate()}`,
              $gte: daysToVerifyAvail[i].date,
              // $lt: `${upperLimitOfDateCheck.getFullYear()}-${
              //   upperLimitOfDateCheck.getMonth() + 1
              // }-${upperLimitOfDateCheck.getDate()}`,
              $lt: upperLimitOfDateCheck,
            },
            employee_num: mechanic.employee_number,
            deleted: false,
            archived: false,
          },
          null,
          { sort: { employee_number: 'ascending' } },
          (err, result) => {
            if (err) {
              res.status(400).json({
                message: 'Unable to get appointments for this date',
                error: err.message,
              })
            } //else if (result.length > 0) {
            console.log(`result: ${result}`)
            console.log(`result length: ${result.length}`)
            if (result.length === 0) {
              console.log(`daysTo: ${JSON.stringify(daysToVerifyAvail)}`)
              console.log(`true1`)
              console.log(`i: ${i}`)
              console.log(`day: ${daysToVerifyAvail[i].date}`)
              console.log(`avail? ${daysToVerifyAvail[i].available}`)
              daysToVerifyAvail[i].available = true
              return
            } else if (result.length === 1) {
              //*check time between opening and appointment
              if (result[0].date.getHours() > garage.opening_time / 60) {
                const timeBefore =
                  result[0].date.getHours() * 60 +
                  result[0].date.getMinutes() -
                  garage.opening_time
                console.log(`timeBefore1: ${timeBefore}`)
                if (timeBefore >= req.query.total_estimated_time) {
                  daysToVerifyAvail[i].available = true
                  console.log(`true2`)
                  return
                }
              }

              //*Check time between appoint and closing
              const timeUntilClose =
                garage.closing_time -
                (result[result.length - 1].date.getHours() * 60 +
                  result[result.length - 1].date.getMinutes() + //start time of last apt
                  result[result.length - 1].total_estimated_time)
              console.log(`timeUntilClose1 ${timeUntilClose}`)
              if (timeUntilClose >= req.query.total_estimated_time) {
                daysToVerifyAvail[i].available = true
                console.log(`true3`)
                return
              }
            }
            //If there are multiple appoints
            else {
              //*check time between opening and appointment
              if (result[0].date.getHours() > garage.opening_time / 60) {
                const timeBefore =
                  result[0].date.getHours() * 60 +
                  result[0].date.getMinutes() -
                  garage.opening_time
                console.log(`timebefore2: ${timeBefore}`)
                if (timeBefore >= req.query.total_estimated_time) {
                  daysToVerifyAvail[i].available = true
                  console.log(`true4`)
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
                console.log(`timebetweenappoints: ${timeBetweenAppoints}`)

                if (req.query.appointLength <= timeBetweenAppoints) {
                  daysToVerifyAvail[i].available = true
                  console.log(`true5`)
                  return
                }
              }
              //*check time between last appointment of the day, and closing time
              const timeUntilClose =
                garage.closing_time -
                (result[result.length - 1].date.getHours() * 60 +
                  result[result.length - 1].date.getMinutes() + //start time of last apt
                  result[result.length - 1].total_estimated_time)
              console.log(`timeuntilclose2: ${timeUntilClose}`)
              if (timeUntilClose >= req.query.appointLength) {
                daysToVerifyAvail[i].available = true
                console.log(`true6`)
                return
              }
            }
            console.log(`nothing found!`)
            //}
          }
        )*/
      }
    }

    console.log(
      `Sending to front: ${JSON.stringify(daysToVerifyAvail, null, 2)}`
    )
    res.status(200).json(daysToVerifyAvail)
  } catch (err) {
    console.warn(
      `An error occurred in appoints_get_free_days_of_week @ time: ${helpers.getTimeStamp()}`
    )
    console.warn(`Error: ${err.message}`)
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

//send employee_num in query params
const appoints_get_nearest_appoint_by_employee = async (req, res) => {
  await Appointment.find({
    employee_num: req.query.employee_num,
    delete: false,
    archived: false,
    appointment_status: 3,
  })
    .sort({ date: 'ascending' })
    .then(async (appointments) => {
      Appointment.findById(appointments[0]._id).then(async (appointment) => {
        const employee = await Employee.findOne({
          employee_number: appointment.employee_num,
        })
        const vehicle = await Vehicle.findOne({
          'appointments._id': appointment._id,
        })
        appointment.description =
          appointment.description +
          ';' +
          employee.first_name +
          ';' +
          vehicle.year +
          ' ' +
          vehicle.make +
          ' ' +
          vehicle.model

        res.status(200).json(appointment)
      })
    })
    .catch((err) => {
      console.warn(
        `An error occured in appoints_get_nearest_appoint_by_employee @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get appointments',
        error: err.message,
      })
    })
}
const appoints_get_by_client = (req, res) => {
  let token = helpers.getDecodedToken(req)
  Appointment.find({
    client: token.id,
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
const appoints_get_by_client_id = (req, res) => {
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
  date = new Date(req.query.date)
  nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + 1)
  Appointment.find({
    date: {
      $gte: date.toISOString(),
      $lt: nextDate.toISOString(),
    },
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
  lowerDate = new Date(req.query.lower_date)
  upperDate = new Date(req.query.upper_date)
  nextUpperDate = new Date(upperDate)
  nextUpperDate.setDate(nextUpperDate.getDate() + 1)
  Appointment.find({
    date: {
      $gte: lowerDate,
      $lt: nextUpperDate,
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
//in query params: vehicleId
const appoints_get_by_vehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.query.vehicleId,
      deleted: false,
    }).exec()
    const appoints = []
    console.log(`${JSON.stringify(vehicle)}`)
    console.log(`${JSON.stringify(vehicle.appointments)}`)
    const appointIds = vehicle.appointments
    //console.log(`appoints: ${JSON.stringify(appointIds)}`)
    for (let i = 0; i < appointIds.length; i++) {
      //console.log(`appointment: ${JSON.stringify(appointIds[i]._id)}`)
      await Appointment.findOne({
        _id: appointIds[i]._id,
        deleted: false,
        archived: false,
      })
        .then((result) => {
          console.log(`${JSON.stringify(result)}`)
          if (result != null) appoints.push(result)
        })
        .catch((err) => {
          console.warn(
            `An error occured in appoints_get_by_vehicle @ time: ${helpers.getTimeStamp()}`
          )
          console.log(`Error: ${err.message}`)
          return res.status(400).json({
            message: 'Unable to get appointments for that vehicle',
            error: err.message,
          })
        })
    }
    res.status(200).json(appoints)
  } catch (err) {
    console.warn(
      `An error occured in appoints_get_by_vehicle @ time: ${helpers.getTimeStamp()}`
    )
    console.log(`Error: ${err.message}`)
    res.status(400).json({
      message: 'Unable to get appoints for the vehicle',
      error: err.message,
    })
  }
}

/*
 * In query params:
 * - date: the date of the appoints to get
 * - appointment_status_lower: the lower limit status of the appointment to get
 * - appointment_status_upper: the upper limit of the status
 */
const appoints_get_by_date_and_appoint_status = async (req, res) => {
  const date = new Date(req.query.date)
  let nextDate = new Date(req.query.date)
  nextDate.setDate(nextDate.getDate() + 1)
  Appointment.find({
    date: {
      $gte: date.toISOString(),
      $lt: nextDate.toISOString(),
    },
    deleted: false,
    archived: false,
    appointment_status: {
      $gte: req.query.appointment_status_lower,
      $lte: req.query.appointment_status_upper,
    },
  })
    .sort({ date: 'ascending' })

    .then(async (appointments) => {
      console.log(
        `Get appoint by date and appoint status @ time: ${helpers.getTimeStamp()}`
      )
      //const response = []
      for (appointment of appointments) {
        const client = await Client.findById(appointment.client)
        const employee = await Employee.findOne({
          employee_number: appointment.employee_num,
        })
        const vehicle = await Vehicle.findOne({
          'appointments._id': appointment._id,
        })
        //console.log(`vehicle: ${JSON.stringify(vehicle, null, 2)}`)
        //console.log(`appointment: ${JSON.stringify(appointment, null, 2)}`)
        //console.log(`client: ${JSON.stringify(appointment.client)}`)
        //console.log(`employee: ${JSON.stringify(appointment.employee_num)}`)
        appointment.description =
          appointment.description +
          ';' +
          client.full_name +
          ';' +
          employee.first_name +
          ' ' +
          employee.last_name +
          ';' +
          vehicle.year +
          ' ' +
          vehicle.make +
          ' ' +
          vehicle.model

        //response.push(appointment)
      }
      res.status(200).json(appointments)
    })
    .catch((err) => {
      console.warn(
        `An error occurred in: appoints_get_by_date_and_appoint_status @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get appointments!',
        error: err.message,
      })
    })
}
//in query params: appointId
const appoints_get_progress_by_id = (req, res) => {
  Appointment.findById(req.query.appointId).then((appointment) => {
    res.status
      .json({
        status: appointment.appointment_status,
      })
      .catch((err) => {
        console.warn(
          `An error occured in appoints_get_progress_by_id @ time: ${helpers.getTimeStamp()}`
        )
        console.log(`Error: ${err.message}`)
        res.status(400).json({
          message: 'An error occured!',
          error: err.message,
        })
      })
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

/*
 * In query params:
 * - appointId: id of appoint to be updated
 * In Body:
 * - newValue: int of new appoint status
 */
const appoints_update_status = async (req, res) => {
  await Appointment.findByIdAndUpdate(
    req.query.appointId,
    {
      appointment_status: req.body.newValue,
    },
    { new: true },
    (err, result) => {
      if (err) {
        console.warn(
          `An error occured in appoints_update_status @ time: ${helpers.getTimeStamp()}`
        )
        console.log(`Error: ${err.message}`)
        res.status(400).json({
          message: 'Unable to update appointment status!',
          error: err.message,
        })
      } else {
        console.log(
          `Updated status of appointment: ${
            result._id
          } @ time: ${helpers.getTimeStamp()}`
        )
        res.status(200).json({
          message: 'Updated appointment status!',
          appointment: result._id,
          status: result.appointment_status,
        })
      }
    }
  )
}
//? I dont think this is needed since we're updating the endtime when
//? we mark the appointment as complete
const appoints_update_end_time = (req, res) => {}
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
  appoints_get_by_client_id,
  appoints_get_by_vehicle,
  appoints_get_by_date_and_employee,
  appoints_get_by_date_and_client,
  appoints_get_by_date_and_appoint_status,
  appoints_get_by_date_range,
  appoints_get_nearest_appoint_by_employee,
  appoints_get_one_by_id,
  appoints_get_availability_by_date,
  appoints_get_free_days_of_week,
  appoints_get_progress_by_id,
  archived_appoints_get_all,
  archived_appoints_get_by_user,
  archived_appoints_get_by_id,
  //U
  appoints_update,
  appoints_complete,
  appoints_update_start_time,
  appoints_update_status,
  //D
  appoints_delete,
}
