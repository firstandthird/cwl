const AWS = require('aws-sdk');

module.exports = (argv) => {
  if (argv.key && argv.secret && argv.profile === 'default') {
    AWS.config.update({ accessKeyId: argv.key, secretAccessKey: argv.secret });
  } else {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: argv.profile });
  }
  if (!argv.region) {
    argv.region = 'us-east-1';
  }
  return new AWS.CloudWatchLogs({ region: argv.region });
};
