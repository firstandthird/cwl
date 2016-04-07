const Logr = require('logr');
const moment = require('moment');
const _ = require("lodash");
const log = new Logr({
  type: 'cli',
  renderOptions: {
    cli: {
    }
  }
});

const getTimestamp = (timestamp) => {
  return moment(timestamp).format('MMMM Do, HH:mm:ss');
};

const printLog = (argv, logEvent) => {
  if (argv.p) {
    log(`${logEvent.logStreamName}  ${getTimestamp(logEvent.timestamp)}: ${logEvent.message.yellow}`);
  } else {
    log(`${getTimestamp(logEvent.timestamp)}: ${logEvent.message.yellow}`);
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
