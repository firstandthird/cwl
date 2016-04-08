'use strict';
const Table = require('cli-table');
const streamsLib = require('./streams.js');
const async = require('async');
const moment = require('moment');
const _ = require('lodash');
const purdy = require('purdy');
// const logUtils = require('../lib/logUtils');

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
    default: undefined,
    describe: 'an AWS RegEx to filter against'
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
        allStreamEvents = allStreamEvents.concat(eventData.events);
        if (eventData.nextToken) {
          params.nextToken = eventData.nextToken;
        } else {
          isDone = true;
        }
        done();
      });
    },
    () => {
      printLogSet(argv, stream, allStreamEvents);
      allDone(null, allStreamEvents);
    }
  );
};

const getLogEventsForStreams = (cwlogs, argv, streams, done) => {
  async.eachSeries(streams, (stream, callback) => {
    // if they specified a stream list and this isn't on it, skip this stream:
    if (argv.s.length > 0 && argv.s.indexOf(stream.logStreamName) < 0) {
      return callback(null, []);
    }
    getLogEventsForStream(cwlogs, argv, stream, callback);
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
