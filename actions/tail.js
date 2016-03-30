/* eslint-disable no-console */
'use strict';
const purdy = require('purdy');
const _ = require('lodash');
module.exports.builder = {
  l: {
    alias: 'limit',
    default: 30,
    describe: 'limit the # of log events to fetch at a time'
  },
  r: {
    alias: 'region',
    describe: 'AWS Region to use',
    default: 'us-east-1',
  },
  g: {
    alias: 'group',
    describe: 'Group you want to list',
    default: 'prod-apps',
  },
  s: {
    alias: 'stream',
    describe: 'Stream Name (optional)',
    default: undefined,
  },
  i: {
    alias: 'interval',
    describe: '# of seconds to wait before fetching newest set of logs',
    default: 5,
  },
  m: {
    alias: 'max',
    describe: 'maximum # of times to fetch before exiting',
    default: 300,
  },
};

const tail = (cwlogs, argv) => {
  const logGroupName = argv.group;
  const logStreamName = argv.stream;
  if (logStreamName) {
    console.log(' Tailing logs for group %s stream %s', logGroupName, logStreamName);
  } else {
    console.log(' Tailing logs for group %s ', logGroupName);
  }
  const initialParams = {
    logGroupName,
    interleaved: true
  };

  if (logStreamName) {
    initialParams.logStreamNames = [logStreamName];
  }

  let count = 0;
  const defaultInterval = argv.i * 1000;
  const timePadding = 10 * 1000;
  const seenEvents = {};

  const getLogs = (params, startTime, limit) => {
    params.startTime = params.startTime ? params.startTime : new Date().getTime() - startTime - timePadding;
    console.log(`fetching new log events at ${new Date(params.startTime).toTimeString()}--------------------------------`);
    params.limit = argv.l;
    cwlogs.filterLogEvents(params, (error, data) => {
      params.startTime = _.last(data.events).timestamp;
      if (error) {
        console.log(error);
      }

      if (data.events.length !== 0) {
        data.events.forEach((event) => {
          if (seenEvents[event.eventId]) {
            return;
          }
          const d = new Date(event.timestamp);
          const localTime = d.toLocaleTimeString();
          if (event.message[0] === '{') {
            const json = JSON.parse(event.message);
            json.localTime = localTime;
            purdy(json);
          } else {
            console.log(`${localTime}: ${event.message}`);
          }
          seenEvents[event.eventId] = true;
        });
      }
      count++;
      if (count === argv.m) {
        console.log('--- All Done ---');
        process.exit(0);
      }
      setTimeout(() => {
        getLogs(params, defaultInterval);
      }, defaultInterval);
    });
  };

  getLogs(initialParams, 1000 * 60 * 30, 30);
};

module.exports.handler = (cwlogs, argv) => {
  tail(cwlogs, argv);
};
