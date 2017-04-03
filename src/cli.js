const co = require('co');

const restore = require('./dump-to-file').restore;
const download = require('./s3').download;

function* main() {
  const srcS3File = process.argv[2];
  const dstUrl = process.argv[3];
  if (!srcS3File || !dstUrl) {
    console.error('Usage:');
    console.error('./cli.js [S3Filename] [dbUrl]');
    return;
  }
  const downloadedFile = yield download(srcS3File);
  yield restore(downloadedFile, dstUrl);
}

co(main).catch(console.error);
