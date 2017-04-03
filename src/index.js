const _ = require('lodash');
const co = require('co');
const ms = require('ms');
const wait = require('co-wait');

const dump = require('./dump-to-file').dump;
const upload = require('./s3').upload;

const PERIOD = '6h';

function* backup(srcUrl) {
  const dumpFile = yield dump(srcUrl);
  yield upload(dumpFile);
}

function* main() {
  const dbUrls = _.compact(_.split(process.env.BACKUP_URLS, ','));

  while (true) {
    for (const url of dbUrls) {
      try {
        yield backup(url);
      } catch (err) {
        console.error(err);
        continue;
      }
      console.log('done');
    }

    console.log(`waiting for next backup pass in ${PERIOD}`);
    yield wait(ms(PERIOD));
  }
}

co(main).catch(console.error);
