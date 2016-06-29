'use strict';
const moment = require('moment');
const _ = require('lodash');
const purdy = require('purdy');
const ora = require('ora');

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
