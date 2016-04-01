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

const getTags = (argv, logEvent) => {
  try {
    const msg = JSON.parse(logEvent.message);
    return _.keys(msg.tags).join(',');
  } catch (exc) {
    return 'None';
  }
};

const getTimestamp = (timestamp) => {
  return moment(timestamp).format('MMMM Do, HH:mm:ss');
};

const getMsg = (argv, logEvent) => {
  try {
    const msg = JSON.parse(logEvent.message);
    return JSON.stringify(msg.message);
  } catch (exc) {
    return logEvent.message;
  }
};

const printLog = (argv, logEvent) => {
  const tags = getTags(argv, logEvent);
  const msg = getMsg(argv, logEvent);
  // console.log(`${logEvent.logStreamName} ${getTimestamp(logEvent.timestamp).red} ${logEvent.tags} ${logEvent.message.yellow}`);
  log(tags, `${logEvent.logStreamName}  ${getTimestamp(logEvent.timestamp)}: ${msg.yellow}`);
};

const printLogSet = (argv, logs) => {
  logs.forEach((l) => {
    // todo: see if the log msg has tags and print them correctly
    printLog(argv, l);
  });
}

module.exports.getTimestamp = getTimestamp;
module.exports.printLog = printLog;
module.exports.printLogSet = printLogSet;
module.exports.getTags = getTags;
module.exports.getMsg = getMsg;
