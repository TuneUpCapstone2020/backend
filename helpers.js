const dateFormat = require('dateformat')

const getTimeStamp = () => {
  let date_ob = new Date()
  // let date = ('0' + date_ob.getDate).slice(-2)
  // let month = ("0" + (date_ob.getMonth() + 1)).slice(-2)
  // let year = date_ob.getFullYear()
  // let hours = date_ob.getHours()
  // let minutes = date_ob.getMinutes()
  // let seconds = date_ob.getSeconds()

  // return `${seconds}:${minutes}:${hours} ${date}-${month}-${year}`
  //return dateFormat(date_ob, 'hh:MM:ss dd-mm-yyyy')
  return dateFormat(date_ob, 'isoDateTime')
}

module.exports = {
  getTimeStamp,
}
