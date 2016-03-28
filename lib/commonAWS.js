const AWS = require('aws-sdk');

module.exports = (argv) => {
  console.log("init AWS stuff:")
  console.log(argv);
  argv.key = argv.key ? argv.key : argv.AWS_ACCESS_KEY_ID;
  argv.secret = argv.secret ? argv.secret : argv.AWS_SECRET_ACCESS_KEY;
  console.log("init AWS stuff:")
  console.log(argv);
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
