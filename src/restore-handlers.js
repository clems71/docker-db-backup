const _ = require('lodash')
const exec = require('teen_process').exec
const fse = require('co-fs-extra')
const fs = require('fs')

exports.file = function * (filename, url) {
  yield fse.ensureDir(url.pathname)
  yield exec('tar', ['-xzf', filename, '-C', url.pathname, '--strip-components', '1'])
}

exports.mongodb = function * (filename, url) {
  // filename = `${filename}.tar`
  yield fse.emptyDir('dump')
  yield exec('tar', ['-xf', filename])
  yield exec('mongorestore', ['-h', url.host, '--gzip'])
}

exports.postgres = function * (filename, url) {
  const dbname = url.pathname.replace('/', '')
  const [user, pass] = _.split(url.auth, ':')
  yield fse.emptyDir('dump')

  yield exec('tar', ['-xzf', filename])
  try {
    yield fse.writeFile('.pgpass', `${url.host}:5432:${dbname}:${user}:${pass}`)
    yield fse.chmod('.pgpass', 0o600)
    yield exec('psql', ['-h', url.host, '-f', 'dump/dump.sql', '-w', '-d', dbname, '-U', user])
  } catch (e) {
    console.log(e.stdout)
    console.error(e.stderr)
  }
}
