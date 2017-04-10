const _ = require('lodash');
const parseUrl = require('url').parse;

module.exports = function(srcUrl) {
  const url = parseUrl(srcUrl, true);
  if (!url) throw Error(`${srcUrl} is not a valid url`);

  // Try to extract a proper dump name from URL
  // we support either a query param named `dumpName` or we fallback on url hostname
  const host = _.get(url, 'host');
  const dumpName = _.get(url, 'query.dumpName', host);

  const scheme = url.protocol.slice(0, -1);

  return {
    url,
    scheme,
    dumpName
  };
};
