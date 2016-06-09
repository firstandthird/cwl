'use strict';
const Table = require('cli-table');
const streamsLib = require('./streams.js');
const async = require('async');
const moment = require('moment');
const _ = require('lodash');
const purdy = require('purdy');
const logUtils = require('../lib/logUtils');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

let screen;
let scrollableTable;
const rows = [ ];

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
  scroll: {
    default: false,
    describe: 'set to true to print as a scrollable list'
  },
  q: {
    alias: 'query',
    default: undefined,
    describe: 'an AWS RegEx to filter against'
  }
};

const printScrollableTable = (argv, logData) => {
  screen = blessed.screen({
    smartCSR: true
  });
  screen.key(['escape', 'q', 'C-c'], (ch, key) => {
    return process.exit(0);
  });
  scrollableTable = contrib.table({
    width: '80%',
    height: '80%',
    keys: true,
    interactive: true,
    label: 'Matching Log Events',
    columnWidth: [20, 50, 20],
    border: { type: "line", fg: "cyan" },
    selectedFg: 'white',
    selectedBg: 'blue',
  });
  scrollableTable.focus();
  screen.append(scrollableTable);

  screen.render();

  _.each(logData.slice(0, argv.l), (log, count) => {
    rows.push([
      count,
      `${log.logStreamName}: ${log.message}`,
      moment(log.timestamp).format('YYYY-MM-DD HH:mm:SS')
    ]);
  });
  scrollableTable.setData({
    headers: ['Count', 'Msg', 'Timestamp'],
    data: rows
  });
};

const printLogSet = (argv, logData) => {
  if (logData.length === 0) {
    return;
  }
  if (argv.scroll) {
    return printScrollableTable(argv, logData);
  }
  // sift messages by any query param:
  if (!argv.p) {
    const table = new Table({
      head: ['No', 'Msg', 'Timestamp'],
      colWidths: [3, 130, 25]
    });
    _.each(logData.slice(0, argv.l), (log, count) => {
      table.push([
        count,
        `${log.logStreamName}: ${log.message}`,
        moment(log.timestamp).format('YYYY-MM-DD HH:mm:SS')
      ]);
    });
    console.log(table.toString());
  } else {
    purdy(logData.slice(0, argv.l));
  }
};

const getParamsForEventQuery = (argv, streams) => {
  const params = {
    logGroupName: argv.g,
    limit: 10000,
    startTime: 0
  };
  // specify which streams to search based on user preference:
  if (argv.s.length > 0) {
    params.logStreamNames = streams;
  }
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

const getLogEventsForStream = (cwlogs, argv, streams, allDone) => {
  const params = getParamsForEventQuery(argv, streams);
  const allStreamEvents = [];
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
        // put a page out there for this:
        printLogSet(argv, eventData.events);
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

module.exports.handler = (cwlogs, argv) => {
  logUtils.startSpinner();

  async.auto({
    streams: (done) => {
      if (argv.s.length > 0) {
        return done(null, argv.s);
      }
      console.log(`searching all streams in group ${argv.g} (this may take a while)`);
      streamsLib.getStreams(cwlogs, [argv.g], (err, streams) => {
        done(err, streams);
      });
    },
    events: ['streams', (results, done) => {
      getLogEventsForStream(cwlogs, argv, results.streams, done);
    }
  ] }
  , (err) => {
    logUtils.stopSpinner();
    if (err) {
      throw err;
    }
  });
};
