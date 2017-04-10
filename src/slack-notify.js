const _ = require('lodash');
const bytes = require('bytes');
const ms = require('ms');
const request = require('superagent');

function* notify(backupInfo) {
  const slackWebhookUrl = process.env.BACKUP_SLACK_URL;
  if (!slackWebhookUrl) return;

  const tTotal = _.sumBy(backupInfo, 'tTotal');
  const text = `Backup done in ${ms(tTotal)}`;

  const attachments = _.map(backupInfo, info => {
    const text = info.err
      ? `${info.dumpName} : backup failed in ${ms(info.tTotal)}`
      : `${info.dumpName} : backup successful in ${ms(info.tTotal)}, size is ${bytes(info.backupSize)}`;
    return {
      text,
      color: info.err ? 'danger' : 'good'
    };
  });

  const payload = {
    text,
    attachments
  };

  yield request.post(slackWebhookUrl).send(payload);
}

module.exports = notify;
