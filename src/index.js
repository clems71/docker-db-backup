const _ = require('lodash');
const co = require('co');
const fs = require('fs');
const fse = require('co-fs-extra');
const ms = require('ms');
const path = require('path');
const wait = require('co-wait');

const dump = require('./dump-to-file').dump;
const notify = require('./slack-notify');
const upload = require('./s3').upload;
const urlParse = require('./url-parse');

const PERIOD = process.env.BACKUP_PERIOD || '6h';

// Perform a dump + upload operation.
// It also acquires some stats about the operation, for logging and notification
// purpose.
function* backup(srcUrl) {
  const t0 = _.now();
  const dumpName = urlParse(srcUrl).dumpName;

  try {
    yield fse.emptyDir('./workdir');

    // Perform the DB dump
    const dumpFile = yield dump(srcUrl, { outDir: './workdir' });
    const stat = fs.statSync(dumpFile);

    // Upload to S3
    yield upload(dumpFile);

    // Return some stats about backup file
    return {
      err: null,
      tTotal: _.now() - t0,
      filename: path.basename(dumpFile),
      backupSize: stat.size,
      dumpName
    };
  } catch (e) {
    return {
      err: e,
      tTotal: _.now() - t0,
      dumpName
    };
  }
}

function* main() {
  const dbUrls = _.compact(_.split(process.env.BACKUP_URLS, ','));

  while (true) {
    let backupInfo = [];

    for (const url of dbUrls) {
      const info = yield backup(url);
      backupInfo.push(info);

      if (info.err) {
        console.error('! failed');
        console.error(info.err);
      } else {
        console.log(`→ done with success in ${ms(info.tTotal)}`);
      }
    }

    try {
      yield notify(backupInfo);
    } catch (e) {
      console.error('failed to send notifications');
      console.error(e);
    }

    console.log(`waiting for next backup pass in ${PERIOD}`);
    yield wait(ms(PERIOD));
  }
}

co(main).catch(console.error);
