'use strict';
const AWS = require('aws-sdk');

module.exports = (argv) => {
  const key = argv.access_key ? argv.access_key : process.env.AWS_ACCESS_KEY_ID;
  const secret = argv.secret_key ? argv.secret_key : process.env.AWS_SECRET_ACCESS_KEY;
  const region = argv.region ? argv.region : process.env.AWS_DEFAULT_REGION;
  const profile = argv.profile ? argv.profile : 'default';
  if (key && secret && profile === 'default') {
    console.log(`initializing AWS with ${key} ${secret} ${region}  ${profile}`);
    AWS.config.update({ accessKeyId: key, secretAccessKey: secret, region });
  } else {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
  }
  return new AWS.CloudWatchLogs({ region });
};
