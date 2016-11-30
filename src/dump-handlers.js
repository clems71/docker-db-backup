const _ = require('lodash')
const exec = require('teen_process').exec
const fse = require('co-fs-extra')

exports.file = function * (url, filename) {
  filename = `${filename}.tar.gz`
  yield exec('tar', ['-czf', filename, url.pathname])
  return filename
}

exports.mongodb = function * (url, filename) {
  filename = `${filename}.tar`
  yield fse.emptyDir('dump')
  yield exec('mongodump', ['-h', url.host, '--gzip'])
  yield exec('tar', ['-cf', filename, 'dump'])
  return filename
}

exports.mysql = function * (url, filename) {
  filename = `${filename}.tar.gz`
  const [user, pass] = _.split(url.auth, ':')
  yield fse.emptyDir('dump')
  yield exec(
    'mysqldump',
    ['-h', url.host, '-u', user, '-p' + pass, '--all-databases', '-r', 'dump/dump']
  )
  yield exec('tar', ['-czf', filename, 'dump'])
  return filename
}
