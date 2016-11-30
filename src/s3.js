const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')

function isVersioningEnabled (s3, bucket) {
  return new Promise((resolve, reject) => {
    s3.getBucketVersioning({ Bucket: bucket }, (err, data) => {
      if (err) return reject(err)
      resolve(data.Status === 'Enabled')
    })
  })
}

function upload (s3, bucket, srcFilePath) {
  return new Promise((resolve, reject) => {
    s3.upload({
      Bucket: bucket,
      Key: path.basename(srcFilePath),
      Body: fs.createReadStream(srcFilePath)
    }, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

exports.upload = function * (name, filePath) {
  const bucket = process.env.AWS_BUCKET
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  })

  console.log(`starting ${name} upload to S3 bucket ${bucket}`)

  const vEnabled = yield isVersioningEnabled(s3, bucket)
  if (!vEnabled) throw Error('this bucket does not support versionning, please enable it and restart')
  yield upload(s3, bucket, filePath)
  console.log(`→ done`)
}
