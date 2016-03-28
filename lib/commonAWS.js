'use strict';
const AWS = require('aws-sdk');

module.exports = (argv) => {
  let key = argv.key ? argv.key : process.env.AWS_ACCESS_KEY_ID;
  let secret = argv.secret ? argv.secret : process.env.AWS_SECRET_ACCESS_KEY;
  let region = argv.region ? argv.region : process.env.AWS_DEFAULT_REGION;
  let profile = argv.profile ? argv.profile : 'default';
  if (key && secret && profile === 'default') {
    console.log("Logging in to AWS with Access Key %s and profile %s", key, secret, profile);
    AWS.config.update({ accessKeyId: key, secretAccessKey: secret });
  } else {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: profile });
  }
  return new AWS.CloudWatchLogs({ region: region });
};
