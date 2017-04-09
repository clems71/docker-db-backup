const _ = require('lodash');
const shell = require('pshell');
const fse = require('co-fs-extra');
const fs = require('fs');
const path = require('path');

exports.file = function*(url, filename) {
  const srcPath = url.pathname;
  const srcStats = fs.statSync(srcPath);

  filename = `${filename}.tar.lz4`;

  if (!srcStats.isDirectory()) {
    throw Error(`${srcPath} is not a directory`);
  }

  yield shell(
    `tar cf - -C ${path.dirname(srcPath)} ${path.basename(srcPath)} | lz4 -f - ${filename}`
  );

  return filename;
};

exports.mongodb = function*(url, filename) {
  filename = `${filename}.tar`;
  yield fse.emptyDir('dump');
  yield shell(`mongodump -h ${url.host} --gzip`);
  yield shell(`tar -cf ${filename} dump`);
  return filename;
};

exports.mysql = function*(url, filename) {
  filename = `${filename}.tar.gz`;
  const [user, pass] = _.split(url.auth, ':');
  yield fse.emptyDir('dump');
  const cred = user ? `-u ${user} -p${pass}` : '';
  yield shell(`mysqldump -h ${url.host} ${cred} --all-databases -r dump/dump`);
  yield shell(`tar -czf ${filename} dump`);
  return filename;
};
