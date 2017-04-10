const _ = require('lodash');

const urlParse = require('./url-parse');
const dumpHandlers = require('./dump-handlers');
const restoreHandlers = require('./restore-handlers');

exports.dump = function*(srcUrl, opts) {
  opts = _.defaults(opts, {
    outDir: '.'
  });

  const { url, scheme, dumpName } = urlParse(srcUrl);
  if (!dumpName) throw Error(`cannot get a proper dumpName from url ${srcUrl}`);

  console.log(`starting ${dumpName} dump [${scheme}] ...`);

  // Try to find a proper dump handler
  const handler = dumpHandlers[scheme];
  if (!handler) throw Error(`${scheme} not handled by dump function`);

  // Found one, process then
  const outFileName = yield handler(url, `${opts.outDir}/${dumpName}`);

  // Done!
  console.log(`→ done dumping`);
  return outFileName;
};

exports.restore = function*(srcDumpFile, dstUrl) {
  const { url, scheme } = urlParse(dstUrl);

  console.log(`starting ${srcDumpFile} restoration [${scheme}] ...`);

  // Try to find a proper restore handler
  const handler = restoreHandlers[scheme];
  if (!handler) throw Error(`${scheme} not handled by restore function`);

  // Found one, process then
  yield handler(srcDumpFile, url);

  // Done!
  console.log(`→ done restoring`);
};
