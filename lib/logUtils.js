const Logr = require('logr');
const moment = require('moment');
const _ = require('lodash');
const purdy = require('purdy');
const log = new Logr({
  type: 'cli',
  renderOptions: {
    cli: {
    }
  }
});

const getTimestamp = (timestamp) => {
  return moment(timestamp).format('YYMMDD/HH:mm:ss');
};

const printLog = (argv, logEvent) => {
  if (argv.pp && logEvent.message[0] === '{') {
    const json = JSON.parse(logEvent.message);
    json.localTime = getTimestamp(logEvent.timestamp);
    purdy(json);
  } else {
    if (argv.ps) {
      log(`${logEvent.logStreamName}  ${getTimestamp(logEvent.timestamp)}: ${logEvent.message.yellow}`);
    } else {
      log(`${getTimestamp(logEvent.timestamp)}: ${logEvent.message.yellow}`);
    }
  }
};

const printLogSet = (argv, logs) => {
  logs.forEach((l) => {
    printLog(argv, l);
  });
}

module.exports.getTimestamp = getTimestamp;
module.exports.printLog = printLog;
module.exports.printLogSet = printLogSet;
