const _ = require('lodash')
const AWS = require('aws-sdk')
const co = require('co')
const fs = require('fs')
const ms = require('ms')
const wait = require('co-wait')

const backup = require('./backup')

function uploadBackupToS3 (dbHost, path) {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  })

  return new Promise((resolve, reject) => {
    console.log('starting upload to S3')
    s3.upload({
      Bucket: process.env.AWS_BUCKET,
      Key: `${dbHost}-${(new Date()).toString()}.tar`,
      Body: fs.createReadStream(path)
    }, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

function * main () {
  const dbUrls = _.split(process.env.BACKUP_URLS, ',')

  while (true) {
    for (const dbUrl of dbUrls) {
      try {
        let backupInfo = yield backup.backupDb(dbUrl)
        yield uploadBackupToS3(backupInfo.host, backupInfo.file)
      } catch (err) {
        console.error(err)
      }
      console.log('done')
    }

    console.log('waiting for next backup pass')
    yield wait(ms('6h'))
  }
}

co(main).catch(console.error)
