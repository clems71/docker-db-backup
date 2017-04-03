const _ = require('lodash');
const SendMail = require('sendmail');

const sendmail = SendMail({ silent: true });

module.exports = function({ recipients, subject, html }) {
  return new Promise((resolve, reject) => {
    sendmail(
      {
        from: 'no-reply@docker-db-back.up',
        to: _.join(_.flatten([recipients]), ','),
        subject,
        html
      },
      (err, reply) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};
