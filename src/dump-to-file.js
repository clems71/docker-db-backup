const _ = require('lodash')
const parseUrl = require('url').parse

const dumpHandlers = require('./dump-handlers')

exports.dump = function * (srcUrl) {
  const url = parseUrl(srcUrl, true)
  if (!url) throw Error(`${srcUrl} is not a valid url`)

  // Try to extract a proper dump name from URL
  // we support either a query param named `dumpName` or we fallback on url hostname
  const host = _.get(url, 'host')
  const dumpName = _.get(url, 'query.dumpName', host)
  if (!dumpName) throw Error(`cannot determine a proper dumpName from url ${srcUrl}`)

  // Extract the scheme
  const scheme = url.protocol.slice(0, -1)

  console.log(`starting ${dumpName} dump [${scheme}] ...`)

  // Try to find a proper dump handler
  const handler = dumpHandlers[scheme]
  if (!handler) throw Error(`${scheme} not handled by backup function`)

  // Found one, process then
  const outFileName = yield handler(url, dumpName)

  // Done!
  console.log(`→ done`)
  return outFileName
}
