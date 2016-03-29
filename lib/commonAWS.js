'use strict';
const AWS = require('aws-sdk');

module.exports = (argv) => {
  const key = argv.key ? argv.key : process.env.AWS_ACCESS_KEY_ID;
  const secret = argv.secret ? argv.secret : process.env.AWS_SECRET_ACCESS_KEY;
  const region = argv.region ? argv.region : process.env.AWS_DEFAULT_REGION;
  const profile = argv.profile ? argv.profile : 'default';
  if (key && secret && profile === 'default') {
    AWS.config.update({ accessKeyId: key, secretAccessKey: secret });
  } else {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: profile });
  }
  return new AWS.CloudWatchLogs({ region: region });
};
