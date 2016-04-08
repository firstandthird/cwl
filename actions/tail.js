/* eslint-disable no-console */
'use strict';
const _ = require('lodash');
const logUtils = require('../lib/logUtils');
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
    alias: 'streams',
    describe: 'List of 1 or more streams to show',
    default: [],
    type: 'array'
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
  pp: {
    alias: 'prettyPrint',
    default: true,
    describe: 'attempt to pretty-print logs containing json objects',
    type: 'boolean'
  },
  ps: {
    alias: 'printStreams',
    default: false,
    describe: 'print the log stream, only used when prettyPrint is set to false',
    type: 'boolean'
  }
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
  if (argv.s.length > 0) {
    console.log('setting stream to %s', argv.s);
    initialParams.logStreamNames = argv.s;
  }

  if (logStreamName) {
    initialParams.logStreamNames = [logStreamName];
  }

  let count = 0;
  const defaultInterval = argv.i * 1000;
  const timePadding = 10 * 1000;
  const seenEvents = {};

  const getLogs = (params, startTime) => {
    params.startTime = params.startTime ? params.startTime
      : new Date().getTime() - startTime - timePadding;
    params.limit = argv.l;
    cwlogs.filterLogEvents(params, (error, data) => {
      if (error) {
        console.log(error);
      }
      try {
        params.startTime = _.last(data.events).timestamp;

        if (data.events.length !== 0) {
          data.events.forEach((event) => {
            if (seenEvents[event.eventId]) {
              return;
            }
            logUtils.printLog(argv, event);
            seenEvents[event.eventId] = true;
          });
        }
        count++;
        if (count === argv.m) {
          console.log('--- All Done ---');
          process.exit(0);
        }
      } catch (exc) {
        console.log(exc);
      } finally {
        setTimeout(() => {
          getLogs(params, defaultInterval);
        }, defaultInterval);
      }
    });
  };

  getLogs(initialParams, 1000 * 60 * 10);
};

module.exports.handler = (cwlogs, argv) => {
  tail(cwlogs, argv);
};
