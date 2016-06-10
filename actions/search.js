'use strict';
const Table = require('cli-table');
const streamsLib = require('./streams.js');
const async = require('async');
const moment = require('moment');
const _ = require('lodash');
const purdy = require('purdy');
const logUtils = require('../lib/logUtils');

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 1000,
    describe: 'limit the # of groups to show (default 1000)'
  },
  g: {
    alias: 'group',
    default: 'prod-apps',
    describe: 'specify the group to search in'
  },
  s: {
    alias: 'streams',
    default: [],
    describe: 'comma-separated list of streams to search in',
    type: 'array'
  },
  // b: {
  //   alias: 'beginTime',
  //   default: moment(new Date()).day(-2).toString(),
  //   describe: 'limit the # of groups to show (default 1000)'
  // },
  // e: {
  //   alias: 'endTime',
  //   default: moment().toString(),
  //   describe: 'limit the # of groups to show (default 1000)'
  // },
  p: {
    alias: 'purdy',
    default: false,
    describe: 'set to true to pretty-print as JSON, otherwise prints as table'
  },
  q: {
    alias: 'query',
    describe: 'an AWS RegEx to filter against',
    demand: true
  }
};

const printLogSet = (argv, stream, logData) => {
  // sift messages by any query param:
  console.log('STREAM %s: ---------------------------------------', stream.logStreamName);
  if (!argv.p) {
    const table = new Table({
      head: ['No', 'Msg', 'Timestamp'],
      colWidths: [3, 130, 25]
    });
    _.each(logData.slice(0, argv.l), (log, count) => {
      table.push([
        count,
        log.message,
        moment(log.timestamp).format('YYYY-MM-DD HH:mm:SS')
      ]);
    });
    console.log(table.toString());
  } else {
    purdy(logData.slice(0, argv.l));
  }
};

const getParamsForEventQuery = (argv, stream) => {
  const params = {
    logGroupName: stream.logGroupName,
    startTime: stream.firstEventTimestamp,
    endTime: stream.lastEventTimestamp
  };
  if (argv.q) {
    params.filterPattern = argv.q;
  }
  // if (argv.b) {
  //   params.startTime = moment(argv.b).toDate().getTime()
  // }
  // if (argv.e) {
  //   params.endTime = moment(argv.e).toDate().getTime()
  // }
  return params;
};

const getLogEventsForStream = (cwlogs, argv, stream, allDone) => {
  const params = getParamsForEventQuery(argv, stream);
  let allStreamEvents = [];
  let isDone = false;
  // keep querying AWS until there are no more events:
  async.until(
    () => {
      return isDone;
    },
    (done) => {
      cwlogs.filterLogEvents(params, (err, eventData) => {
        if (err) {
          return allDone(err);
        }
        printLogSet(argv, stream, eventData.events);
        if (eventData.nextToken) {
          params.nextToken = eventData.nextToken;
        } else {
          isDone = true;
        }
        done();
      });
    },
    () => {
      allDone(null, allStreamEvents);
    }
  );
};

const getLogEventsForStreams = (cwlogs, argv, streams, done) => {
  let found = false;
  async.eachSeries(streams, (stream, callback) => {
    // if they specified a stream list and this isn't on it, skip this stream:
    if (argv.s.length > 0) {
      if (argv.s.indexOf(stream.logStreamName) < 0) {
        return callback(null, []);
      } else {
        found = true;
      }
    }
    getLogEventsForStream(cwlogs, argv, stream, callback);
  }, (err, result) => {
    if (argv.s.length > 0) {
      if (!found) {
        console.log(`Did not find any logs for streams ${argv.s}`);
      }
    }
    done();
  });
};

module.exports.handler = (cwlogs, argv) => {
  logUtils.startSpinner();
  async.auto({
    streams: (done) => {
      streamsLib.getStreams(cwlogs, [argv.g], (err, streams) => {
        done(err, streams);
      });
    },
    events: ['streams', (results, done) => {
      getLogEventsForStreams(cwlogs, argv, results.streams, done);
    }
  ] }
  , (err) => {
    logUtils.stopSpinner();
    if (err) {
      throw err;
    }
  });
};
