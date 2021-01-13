const jwt = require('jsonwebtoken')
const Client = require('../models/client')

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt

    //check json web token exists and is verified
    if(token){
        jwt.verify(token, 'tuneup secret', (err, decodedToken) => {
            if(err){
                console.log(err.message)
                res.redirect('/')
            }else{
                console.log(decodedToken)
                next()
            }
        })
    }else{
        res.redirect('/')
    }
}

//check current client
const checkClient = (req, res, next) => {
    const token = req.cookies.jwt

    if(token){
        jwt.verify(token, 'tuneup secret', async (err, decodedToken) => {
            if(err){
                console.log(err.message)
                res.locals.client = null
                next()
            }else{
                console.log(decodedToken)
                let client = await Client.findById(decodedToken.id)
                res.locals.client = client
                next()
            }
        })
    }else{
        res.locals.client = null
        next()
    }
}

module.exports = { requireAuth, checkClient }