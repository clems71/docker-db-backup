const _ = require('lodash')
const AWS = require('aws-sdk')
const co = require('co')
const exec = require('teen_process').exec
const fs = require('fs')
const ms = require('ms')
const wait = require('co-wait')

function * backupDb (dbHost) {
  let res = yield exec('mongodump', ['-h', dbHost])
  if (res.code !== 0) throw Error('error while running mongodump')

  res = yield exec('tar', ['-cvzf', 'backup.tar.gz', 'dump'])
  if (res.code !== 0) throw Error('error while running tar')

  return 'backup.tar.gz'
}

function uploadBackupToS3 (dbHost, path) {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  })

  return new Promise((resolve, reject) => {
    s3.upload({
      Bucket: process.env.AWS_BUCKET,
      Key: `${dbHost}-${(new Date()).toString()}.tar.gz`,
      Body: fs.createReadStream(path)
    }, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

function * main () {
  const dbHosts = _.split(process.env.BACKUP_HOSTS, ',')

  while (true) {
    for (const dbHost of dbHosts) {
      console.log(`backup of ${dbHost}`)

      try {
        const backupFile = yield backupDb(dbHost)
        yield uploadBackupToS3(dbHost, backupFile)
      } catch (err) {
        console.error(err)
      }
    }

    yield wait(ms('1h'))
  }
}

co(main).catch(console.error)
