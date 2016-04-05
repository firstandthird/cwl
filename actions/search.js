'use strict';
const Table = require('cli-table');
const streamsLib = require('./streams.js');
const async = require('async');
const moment = require('moment');
const filter = require('../lib/filter');
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
    alias: 'stream',
    default: '',
    describe: 'specify the stream to search in'
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
    default: undefined,
    describe: 'a Javascript RegEx to filter against'
  }
};

const filterLogSet = (argv, logData) => {
  if (argv.q) {
    logData = filter.filterAll(logData, {
      expression: argv.q,
      fieldName: 'message'
    });
  }
  return logData;
};

const printLogSet = (argv, stream, logData) => {
  logData = filterLogSet(argv, logData);
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
        moment(log.timestamp).format('YYYY-MM-DD HH:MM:SS')
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
    logStreamName: stream.logStreamName,
    startTime: stream.firstEventTimestamp,
    endTime: stream.lastEventTimestamp
  };
  // if (argv.b) {
  //   params.startTime = moment(argv.b).toDate().getTime()
  // }
  // if (argv.e) {
  //   params.endTime = moment(argv.e).toDate().getTime()
  // }
  return params;
};

const getLogEventsForStreams = (cwlogs, argv, streams, done) => {
  async.eachSeries(streams, (stream, callback) => {
    const params = getParamsForEventQuery(argv, stream);
    if (!argv.s) {
      cwlogs.getLogEvents(params, (err, eventData) => {
        printLogSet(argv, stream, eventData.events);
        callback(err);
      });
    } else if (filter.filterOne(stream, { fieldName: 'logStreamName', expression: argv.s })) {
      console.log('fetching events for stream %s', params.logStreamName);
      cwlogs.getLogEvents(params, (err, eventData) => {
        printLogSet(argv, stream, eventData.events);
        callback(err);
      });
    } else {
      callback(null);
    }
  }, done);
};

module.exports.handler = (cwlogs, argv) => {
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
    if (err) {
      throw err;
    }
  });
};
