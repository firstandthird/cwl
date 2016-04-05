/* eslint-disable no-console */
'use strict';
const purdy = require('purdy');

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 10000,
    describe: 'limit the # of groups to show (default 10000)'
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
  const max = 300;
  const defaultInterval = 5 * 1000;
  const timePadding = 10 * 1000;
  const seenEvents = {};

  const getLogs = (params, startTime, limit) => {
    params.startTime = new Date().getTime() - startTime - timePadding;

    params.limit = limit || null;

    cwlogs.filterLogEvents(params, (error, data) => {
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

      params.nextToken = data.nextForwardToken;

      count++;
      if (count === max) {
        console.log('--- All Done ---');
        process.exit(0);
      }
      setTimeout(() => {
        getLogs(params, defaultInterval);
      }, defaultInterval);
    });
  };

  getLogs(initialParams, 1000 * 60 * 10);
};

module.exports.handler = (cwlogs, argv) => {
  tail(cwlogs, argv);
};
