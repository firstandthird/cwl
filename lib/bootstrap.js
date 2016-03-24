const AWS = require('aws-sdk');

const argv = require('yargs')
  .alias('p', 'profile')
  .default('profile', 'default')
  .alias('r', 'region')
  .default('region', 'us-east-1')
  .alias('g', 'group-name')
  .alias('s', 'stream-name')
  .alias('h', 'help')
  .alias('f', 'format')
  .default('format', 'YYYY-MM-DD')
  .default('streams', false)
  .default('limit', 1000)
  .argv;

const action = argv._.shift();
const profile = argv.profile;
const region = argv.region;
const key = argv.key;
const secret = argv.secret;

const configObj = null;

if(key && secret && profile === 'default') {
  AWS.config.update({accessKeyId: key, secretAccessKey: secret});
} else {
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: profile });
}

if(argv.help) {
  action = null;
}

module.exports = {
  action: action,
  aws: AWS,
  region: region,
  argv: argv
};
