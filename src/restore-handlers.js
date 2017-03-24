const _ = require('lodash')
const exec = require('teen_process').exec
const fse = require('co-fs-extra')

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

// Decompress a dump's archive and restore a PostgreSQL database
exports.postgres = function * (filename, url) {
  const dbname = url.pathname.replace('/', '')
  const [user, pass] = _.split(url.auth, ':')
  const [host, port] = _.split(url.host, ':')
  yield fse.emptyDir('dump')
  yield exec('tar', ['-xzf', filename])
  yield fse.writeFile('.pgpass', `${host}:${port}:${dbname}:${user}:${pass}`)
  yield fse.chmod('.pgpass', 0o600)
  yield exec('psql', ['-h', host, '-p', port, '-f', 'dump/dump.sql', '-w', '-d', dbname, '-U', user])
}
