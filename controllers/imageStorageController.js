const Vehicle = require('../models/vehicle')
const helpers = require('../helpers')
const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')

aws.config.update({
  secretAccessKey: process.env.AWSSecretKey,
  accessKeyId: process.env.AWSAccessKeyId,
  region: process.env.AWSRegion,
})

var s3 = new aws.S3()

//pass the images as multipart/form-data
const image_upload = async (req, res) => {
  singleUpload(req, res, function (err) {
    if (err) {
      return res.status(422).json({
        errors: [{ title: 'Image Upload Error', detail: err.message }],
      })
    }

    return res.json({
      message: 'Image successfully uploaded',
      imageUrl: req.file.location,
    })
  })
}

//send the image url in the query params
const image_download = async (req, res) => {
  console.log(`imageUrl: ${req.query.imageUrl}`)
  const imageUrlSplit = req.query.imageUrl.split('/')
  const imageKey = imageUrlSplit[imageUrlSplit.length - 1]
  console.log(`ImageKey: ${imageKey}`)
  const params = { Bucket: process.env.AWSBucketName, Key: imageKey }
  s3.getObject(params, function (err, result) {
    if (err) {
      console.warn(
        `An error occured in image_download @ time: ${helpers.getTimeStamp()}`
      )
      console.log(`Error: ${err.message}`)
      res.status(400).json({
        message: 'Unable to get image',
        error: err.message,
      })
    } else {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' })
      res.write(result.Body, 'binary')
      res.end(null, 'binary')
    }
  })
}
const fileFilter = (req, file, cb) => {
  // if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
  if (file.mimetype === 'image/jpeg') {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type, only JPEG and PNG is allowed!'), false)
  }
}
const upload = multer({
  fileFilter: fileFilter,
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSBucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname })
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    },
  }),
})
const singleUpload = upload.single('image')
module.exports = {
  image_upload,
  image_download,
}
