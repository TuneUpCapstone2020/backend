const Appointment = require('../models/appointment')
const helpers = require('../helpers')
const Vehicle = require('../models/vehicle')
const Garage = require('../models/garage')
const Employee = require('../models/employee')
const _ = require('lodash')
const { forEach } = require('lodash')
const minimumMechanicLevel = 4
//START: Error Handlers
const handleErrors = (err) => {
  console.log(err.message, err.code)

  let errors = {
    date = '',
    start_time = '',
    end_time = '',
    skill_level = '',
    price = '',
    employee_num = '',
    services = ''
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
    console.log(`New appointment created for: ${appointment.date} @ time: ${getTimeStamp()}`)
    await Vehicle.addAppointment(req.query.vehicleId, appointment)
    res.status(201).json({
      message: 'New Appointment created!',
      appointment: appointment._id,
      date: appointment.date
    })
  } catch (err) {
    const errors = handleErrors(err)
    console.warn(`An error occured in appointment_create @ time: ${getTimeStamp()}`)
    res.status(400).json({ errors })
  }
}
//END: ENDPOINTS FOR POST REQUESTS (Create)

//START: ENDPOINTS FOR GET REQUESTS (Retrieve)
const appoints_get_all = (req, res) => {
  Appointment.find({ deleted: false, archived: false }).sort({ createdAt: -1 })
    .then((result) => {
      console.log(`Get request of all appointments @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: appoints_get_all @ time: ${getTimeStamp()}`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}
const appoints_get_one_by_id = (req, res) => {
  Appointment.findById(req.query._id, {
    deleted: false,
    archived: false
  })
    .then((result) => {
      console.log(`Get appoint by id @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    }).catch((err) => {
      console.warn(`An error occured in: appoints_get_one_by_id @ time: ${getTimeStamp()}`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    });
}
//!Define date!
const appoints_get_by_date = (req, res) => {
  Appointment.find({
    date: req.query.date,
    deleted: false,
    archived: false
  })
    .then((result) => {
      console.log(`Get appoint by date @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    }).catch((err) => {
      console.warn(`An error occured in: appoints_get_by_date @ ${getTimeStamp()}`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}

//pass the length of the appoint, and the day (dd-mm-yyyy)
const appoints_get_availability_by_date = async (req, res) => {
  const availableTimes = await Appointment.find({ day: req.query.day }, null, { sort: { date: 'ascending' } }, (err, result) => {
    if (err) {
      console.warn(`An error occured in appoints_get_availability_by_date @ time: ${getTimeStamp()}`)
      res.status(400).json({
        message: 'Unable to get appointments for the day!',
        error: err.message
      })
    } else {
      if (result.length > 1) {
        //give times between appointments
        var times = []
        for (var i = 0; i < result.length; i++) {
          if (result[i].date.
        }
      }
      else if (result.length == 1) {
        //Give times before and after the appointment
      }
      else {
        //give entire day
      }
    }
  })


}

//*Get free days of a month (needs month, appoint length, garage capacity )
const appoints_get_free_days_of_month = (req, res) => {

}
const appoints_get_by_employee = (req, res) => {
  Appointment.find({
    employee_num: req.query.employee_num,
    deleted: false,
    archived: false
  })
    .then((result) => {
      console.log(`Get appoint by employee @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    }).catch((err) => {
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}

const appoints_get_by_client = (req, res) => {
  Appointment.find({
    client: req.query.client_id,
    deleted: false,
    archived: false
  })
    .then((result) => {
      console.log(`Get appoint by user @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    }).catch((err) => {
      console.warn(`An error occured in appoints_get_by_user @ time: ${getTimeStamp()}`);
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })

}

const appoints_get_by_date_and_employee = (req, res) => {
  Appointment.find({
    date: req.query.date,
    employee_num: req.query.employee_num,
    deleted: false,
    archived: false
  })
    .then((result) => {
      console.log(`Get appoint by date and employee @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    }).catch((err) => {
      console.warn(`An error occured in appoints_get_by_date_and_employee @ time: ${getTimeStamp()}`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}
const appoints_get_by_date_and_client = (req, res) => {
  Appointment.find({
    date: req.query.date,
    client: req.query.client_id,
    deleted: false,
    archived: false
  })
    .then((result) => {
      console.log(`Get appoint by date and client @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    }).catch((err) => {
      console.warn(`An error occured in appoints_get_by_date_and_client @ time: ${getTimeStamp()}`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}
const appoints_get_by_date_range = (req, res) => {
  Appointment.find({
    date: {
      $gt: req.query.lower_date,
      $lt: req.query.upper_date
    },
    deleted: false,
    archived: false
  })
    .then((result) => {
      console.log(`Get appoints by date range @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    }).catch((err) => {
      console.warn(`An error occured in appoints_get_by_date_range @ time: ${getTimeStamp()}`)
    });
}


const archived_appoints_get_all = (req, res) => {
  Appointment.find({ deleted: false, archived: true }).sort({ createdAt: -1 })
    .then((result) => {
      console.log(`Get request of all archived appointments @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    })
    .catch((err) => {
      console.warn(`An error occured in: appoints_get_all @ time: ${getTimeStamp()}`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
      })
    })
}
const archived_appoints_get_by_user = (req, res) => {
  Appointment.find({
    client: req.query.user_id,
    deleted: false,
    archived: true
  })
    .then((result) => {
      console.log(`Archived GET by user @ time: ${getTimeStamp()}`)
      res.status(200).json(result)
    }).catch((err) => {
      console.warn(`An error occured in archived_appoints_get_by_user @ time: ${getTimeStamp()}`)
      res.status(400).json({
        message: 'An error occured',
        error: err.message
      })
    })
}
const archived_appoints_get_by_id = (req, res) => {
  Appointment.findById(req.query._id, {
    deleted: false,
    archived: true
  })
    .then((result) => {
      console.log(`get archived appointment by id @ time: ${getTimeStamp()}`)
      res.status(201).json(result)
    }).catch((err) => {
      console.warn(`An error occured in archived_appoints_get_by_id @ time: ${getTimeStamp()}`)
      res.status(400).json({
        message: 'An error occured!',
        error: err.message
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
        console.warn(`An error occured in appoints_update @ time: ${getTimeStamp()}`);
        res.status(400).json({
          message: 'Unable to update appointment!',
          error: err.message
        })
      } else {
        console.log(`Update appoint @ time: ${getTimeStamp()}`);
        res.status(200).json({
          message: 'Appointment updated!',
          appointment: result._id
        })
      }
    })
  } catch (err) {
    console.warn(`An error occured in appoints_update @ time: ${getTimeStamp()}`);
    res.status(400).json({
      message: 'Unable to update appointment!',
      error: err.message
    })
  }

}

const appoints_complete = async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.query._id,
    {
      archived: true,
      end_time: getTimeStamp(), //TODO: make sure this is the correct time format!!!!
      labour_time: req.body.labour_time
    },
    (err, result) => {
      if (err) {
        console.warn(`An error occured in appoints_complete @ time: ${getTimeStamp()}`);
        req.status(400).json({
          message: 'Unable to mark appointment as complete!',
          error: err.message
        })
      } else {
        console.log(`Appointment marked as complete @ time: ${getTimeStamp()}`);
        res.status(200).json({
          message: 'Appointment marked as complete!',
          id: result._id
        })
      }
    }
  )
}

//?Is this needed???
const appoints_update_start_time = async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.query._id,
    { start_time: req.body.start_time }
  )
  appointment.save()
    .then((result) => {
      console.log(`Appointment ${result._id} start time updated @ time: ${getTimeStamp()}`)
      res.status(200).json({
        message: 'Appointment start time updated!',
        id: result._id
      })
    }).catch((err) => {
      console.warn(`An error occurred in appoints_update_start_time @ time: ${getTimeStamp()}`)
      res.status(400).json({
        message: 'Unable to update start time!',
        error: err.message
      })
    })
}

//? I dont think this is needed since we're updating the endtime when
//? we mark the appointment as complete
const appoints_update_end_time = (req, res) => {

}
//END: ENDPOINTS FOR PUT REQUESTS (Update)

//START: ENDPOINTS FOR DELETE REQUESTS (Delete)
const appoints_delete = async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.query._id, { deleted: true }, (err, result) => {
      if (err) {
        console.warn(`An error occured in appoints_delete @ time: ${getTimeStamp()}`);
        req.status(400).json({
          message: 'Unable to delete appointment!',
          error: err.message
        })
      } else {
        console.log(`Appointment deleted @ time: ${getTimeStamp()}`);
        res.status(200).json({
          message: 'Appointment deleted!',
          id: result._id
        })
      }
    })

  } catch (error) {
    console.warn(`An error occured in appoints_delete @ time: ${getTimeStamp()}`);
    req.status(400).json({
      message: 'Unable to delete appointment!',
      error: err.message
    })
  }
}
//END: ENDPOINTS FOR DELETE REQUESTS (Delete)


module.exports = {
  appoints_create,
  appoints_get_all,
  appoints_get_by_date,
  appoints_get_by_employee,
  appoints_get_by_client,
  appoints_get_by_date_and_employee,
  appoints_get_by_date_and_client,
  appoints_get_by_date_range,
  appoints_get_one_by_id,
  archived_appoints_get_all,
  archived_appoints_get_by_user,
  archived_appoints_get_by_id,
  appoints_update,
  appoints_complete,
  appoints_update_start_time
  //TODO Add the rest
}



//ADD crud for packages
//get garage packages, update the packages, check if packages have changed (use modify date)