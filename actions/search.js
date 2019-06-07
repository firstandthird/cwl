'use strict';
const ttyTable = require('tty-table');
const streamsLib = require('./streams.js');
const moment = require('moment');
const _ = require('lodash');
const purdy = require('purdy');
const logUtils = require('../lib/logUtils');
const dimensions = require('window-size');

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

const printLogSet = (argv, logData) => {
  if (logData.length === 0) {
    return;
  }
  // todo: we should set these based on reading
  // the terminal width in the future:
  if (!argv.p) {
    // set the column widths based on screen size:
    const middleColumnWidth = Math.round(0.7 * dimensions.width) - 1;
    const leftColumnWidth = Math.round(0.1 * dimensions.width) - 1;
    const rightColumnWidth = Math.round(0.2 * dimensions.width) - 1;
    const header = [
      {
        value: 'Count',
        align: 'center',
        headerColor: 'green',
        color: 'green',
        width: leftColumnWidth
      },
      {
        value: 'Msg',
        align: 'center',
        formatter: (value) => {
          let str = value;
          for (let i = 0; i < value.length; i++) {
            if (i % (middleColumnWidth - 2) === 0) {
              str = [str.slice(0, i), '\n', str.slice(i)].join('');
            }
          }
          return str;
        },
        headerColor: 'cyan',
        color: 'cyan',
        width: middleColumnWidth
      },
      {
        value: 'Timestamp',
        align: 'left',
        headerColor: 'red',
        color: 'red',
        width: rightColumnWidth
      }
    ];
    const table = ttyTable(header, [], []);
    _.each(logData.slice(0, argv.l), (log, count) => {
      table.push([
        count,
        log.message,
        moment(log.timestamp).format('YYYY-MM-DD HH:mm:SS')
      ]);
    });
    console.log(table.render());
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

const getLogEventsForStream = async(cwlogs, argv, streams) => {
  const params = getParamsForEventQuery(argv, streams);
  const allStreamEvents = [];
  let notDone = true;
  // keep querying AWS until there are no more events:
  do {
    const eventData = await cwlogs.filterLogEvents(params).promise();
    // put a page out there for this:
    printLogSet(argv, eventData.events);
    if (eventData.nextToken) {
      params.nextToken = eventData.nextToken;
    } else {
      notDone = false;
    }
  } while (notDone);
  return allStreamEvents;
};

module.exports.handler = async(cwlogs, argv) => {
  logUtils.startSpinner();
  let streams = '';
  if (argv.s.length > 0) {
    streams = argv.s;
  }
  console.log(`searching all streams in group ${argv.g} (this may take a while)`);
  streams = await streamsLib.getStreams(cwlogs, [argv.g]);
  const events = await getLogEventsForStream(cwlogs, argv, streams);
  logUtils.stopSpinner();
};
