const co = require('co');
const fs = require('fs');

const restore = require('./dump-to-file').restore;
const download = require('./s3').download;

function* main() {
  let s3OrLocalFile = process.argv[2];
  const dstUrl = process.argv[3];

  // Basic checks
  if (!s3OrLocalFile || !dstUrl) {
    console.error('Usage:');
    console.error('./cli.js [s3OrLocalFile] [dbUrl]');
    return;
  }

  if (!fs.existsSync(s3OrLocalFile)) {
    s3OrLocalFile = yield download(s3OrLocalFile);
  }

  yield restore(s3OrLocalFile, dstUrl);
}

co(main).catch(console.error);
