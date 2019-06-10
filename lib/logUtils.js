'use strict';
const Logr = require('logr');
const moment = require('moment');
const _ = require('lodash');
const purdy = require('purdy');
const ora = require('ora');

const logr = new Logr({
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
      logr.log(`${logEvent.logStreamName}  ${getTimestamp(logEvent.timestamp)}: ${logEvent.message.yellow}`);
    } else {
      logr.log(`${getTimestamp(logEvent.timestamp)}: ${logEvent.message.yellow}`);
    }
  }
};

const printLogSet = (argv, logs) => {
  logs.forEach((l) => {
    printLog(argv, l);
  });
}
const spinner = ora('');
let countDown;

const startCountdown = (num) => {
  countDown = ora({
    spinner: {
    interval: 1000,
      frames: _.range(1, num+1).reverse()
  }
  });
  countDown.start();
};
const stopCountdown = () => {
  if (countDown){
    countDown.stop();
  }
};
const startSpinner = () => {
  spinner.start();
};
const stopSpinner = () => {
  spinner.stop();
};
module.exports.startCountdown = startCountdown;
module.exports.stopCountdown = stopCountdown;
module.exports.startSpinner = startSpinner;
module.exports.stopSpinner = stopSpinner;
module.exports.getTimestamp = getTimestamp;
module.exports.printLog = printLog;
module.exports.printLogSet = printLogSet;
