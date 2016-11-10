const _ = require('lodash')
const exec = require('teen_process').exec
const fse = require('co-fs-extra')
const url = require('url')

exports.backupDb = backupDb

function * backupDb (dbUrl) {
  const urlObj = url.parse(dbUrl)
  if (urlObj.host == null) {
    throw Error('Url cannot be correctly parsed')
  }
  const dbFormat = urlObj.protocol.slice(0, -1)
  console.log(`backup of ${urlObj.host} host with ${dbFormat} format`)
  let backupFile
  switch (dbFormat) {
    case 'mysql': backupFile = yield backupDbmySql(urlObj.host, urlObj.auth)
      break
    case 'mongodb': backupFile = yield backupDbmongodb(urlObj.host)
      break
    default: throw Error('Database format not yet managed')
  }
  return {host: urlObj.host, dbFormat: dbFormat, file: backupFile}
}

function * backupDbmongodb (dbHost) {
  console.log('starting dump')
  yield fse.emptyDir('dump')
  let res = yield exec('mongodump', ['-h', dbHost, '--gzip'])
  if (res.code !== 0) throw Error('error while running mongodump')
  return yield compressDump('dump')
}

function * backupDbmySql (dbHost, auth) {
  console.log('starting dump')
  const authObj = _.split(auth, ':')
  yield fse.emptyDir('dump')
  let res = yield exec(
    'mysqldump',
    ['-h', dbHost, '-u', authObj[0], '-p' + authObj[1], '--all-databases', '-r', 'dump/dump'])
  if (res.code !== 0) throw Error('error while running `mysqldump`')
  return yield compressDump('dump/dump')
}

function * compressDump (dump) {
  console.log('starting compression of backup files')
  let res = yield exec('tar', ['-cf', 'backup.tar', dump])
  if (res.code !== 0) throw Error('error while running tar')
  return 'backup.tar'
}
