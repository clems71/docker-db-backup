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
