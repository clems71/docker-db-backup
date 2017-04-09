const _ = require('lodash');
const shell = require('pshell');
const fse = require('co-fs-extra');

exports.file = function*(filename, url) {
  yield fse.ensureDir(url.pathname);
  yield shell(
    `unlz4 -c -v ${filename} | tar xvf - -C ${url.pathname} --strip-components 1`
  );
};

exports.mongodb = function*(filename, url) {
  yield fse.emptyDir('dump');
  yield shell(`tar -xf ${filename}`);
  yield shell(`mongorestore -h ${url.host} --gzip`);
};
