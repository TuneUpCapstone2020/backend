const Employee = require('../models/employee')

const employee_index = (req, res) => {
    Employee.find().sort({ createdAt: -1 })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            throw err
        })
}

const employee_create_employee = (req, res) => {
    //console.log(req.body)
    //const client = new Client(req.body)
    const employee = new Employee({employeeNum: 111, firstName: 'Joe', lastName: 'Blow', pwd: '1234', phoneNum: '514-555-6969', email: 'joeBlows@hotmale.com', address: '5 Avenue Road', wage: 10.50, skillLevel: 0})
  
    employee.save()
      .then((result) => {
        res.redirect('/register')
      })
      .catch((err) => {
        throw err
      })
}

module.exports = {
    employee_index,
    employee_create_employee
}