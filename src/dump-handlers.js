const _ = require('lodash')
const exec = require('teen_process').exec
const fse = require('co-fs-extra')
const fs = require('fs')
const path = require('path')

exports.file = function * (url, filename) {
  const srcPath = url.pathname
  const srcStats = fs.statSync(srcPath)

  if (srcStats.isDirectory()) {
    filename = `${filename}.tar.gz`
    yield exec('tar', ['-czf', filename, '-C', path.dirname(srcPath), path.basename(srcPath)])
  } else {
    throw Error(`${srcPath} is not a directory`)
  }

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

exports.postgres = function * (url, filename) {
  filename = `${filename}.tar.gz`
  const dbname = url.pathname.replace('/', '')
  const [user, pass] = _.split(url.auth, ':')
  yield fse.writeFile('.pgpass', `${url.host}:5432:${dbname}:${user}:${pass}`)
  yield fse.chmod('.pgpass', 0o600)
  yield exec('pg_dump', ['-h', url.host, '-U', user, '-w', '-f', 'dump/dump.sql', dbname])
  yield exec('tar', ['-czf', filename, 'dump'])
  return filename
}
