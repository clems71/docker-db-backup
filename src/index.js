const _ = require('lodash');
const co = require('co');
const fs = require('fs');
const handlebars = require('handlebars');
const ms = require('ms');
const path = require('path');
const wait = require('co-wait');

const dump = require('./dump-to-file').dump;
const upload = require('./s3').upload;
const sendmail = require('./sendmail');

const PERIOD = '6h';

function* backup(srcUrl) {
  // Perform the DB dump
  const t0 = _.now();
  const dumpFile = yield dump(srcUrl);
  const stat = fs.statSync(dumpFile);

  // Upload to S3
  const t1 = _.now();
  yield upload(dumpFile);

  const t2 = _.now();

  // Return some stats about backup file
  return {
    fail: false,
    srcUrl,
    tDump: t1 - t0,
    tUpload: t2 - t1,
    tTotal: t2 - t0,
    filename: path.basename(dumpFile),
    backupSize: stat.size
  };
}

function renderMailTemplate(backupInfo) {
  return 'WIP';
}

function* main() {
  const dbUrls = _.compact(_.split(process.env.BACKUP_URLS, ','));

  while (true) {
    let backupInfo = {
      backups: [],
      tTotal: 0
    };

    const t0 = _.now();

    for (const url of dbUrls) {
      try {
        const oneBackupInfo = yield backup(url);
        backupInfo.backups.push(oneBackupInfo);
        console.log('+ done with success');
      } catch (err) {
        backupInfo.backups.push({ fail: true, srcUrl: url });
        console.error('! failed');
        console.error(err);
        continue;
      }
    }

    backupInfo.tTotal = _.now() - t0;

    yield sendmail({
      recipients: 'infra@allegorithmic.com',
      subject: '[SUCCESS] Docker DB Backup',
      html: renderMailTemplate(backupInfo)
    });

    console.log(`waiting for next backup pass in ${PERIOD}`);
    yield wait(ms(PERIOD));
  }
}

co(main).catch(console.error);
