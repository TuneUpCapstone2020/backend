const Item = require('../models/item')

const item_index = (req, res) => {
    Item.find().sort({ createdAt: -1 })
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            throw err
        })
}

const item_create_item = (req, res) => {
    //console.log(req.body)
    //const item = new Item(req.body)
    const item = new Item({name:'Oil Filter', sellPrice: '9.99', service: false})
  
    item.save()
      .then((result) => {
        res.redirect('/client')
      })
      .catch((err) => {
        throw err
      })
}

module.exports = {
    item_index,
    item_create_item
}