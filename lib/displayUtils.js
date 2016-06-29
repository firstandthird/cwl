'use strict';
// utilities for displaying AWS data to the console in legible fashion:
const moment = require('moment');
const _ = require('lodash');
const columnify = require('columnify');
const Table = require('cli-table');
const purdy = require('purdy');
const colors = require('colors');
const filesize = require('filesize');
const wrapper = require('wordwrap');
const filter = require('../lib/filter');

const getTimestamp = (timestamp) => {
  return moment(timestamp).format('YYMMDD/HH:mm:ss');
};

// used by tail
const printLog = (argv, logEvent) => {
  if (argv.pp && logEvent.message[0] === '{') {
    const json = JSON.parse(logEvent.message);
    json.localTime = getTimestamp(logEvent.timestamp);
    purdy(json);
  } else {
    if (argv.ps) {
      console.log(`${logEvent.logStreamName}  ${getTimestamp(logEvent.timestamp)}: ${logEvent.message.yellow}`);
    } else {
      console.log(`${getTimestamp(logEvent.timestamp)}: ${logEvent.message.yellow}`);
    }
  }
};

const purdyPrint = (argv, logEvents) => {
  // convert the 'message' field to a json obj
  _.each(logEvents, (event) => {
    try {
      event.message = JSON.parse(event.message);
    } catch (e) {
      // do nothing
    }
  });
  return purdy(logEvents);
};

const printLogTable = (argv, logData, startingIndex) => {
  if (argv.p) {
    return purdyPrint(argv, logData.slice(0, argv.l), startingIndex);
  }
  const dimensions = require('window-size');
  let count = startingIndex ? startingIndex : 1;
  const data = [];
  logData.slice(0, argv.l).forEach((log) => {
    const timestamp = moment(log.timestamp).format('YYYY-MM-DD HH:mm:SS');
    // leave the keys here quoted for clarity, since they are headings:
    data.push({
      Count: `#${count}`.yellow,
      Msg: log.message.white,
      Timestamp: timestamp.cyan
    });
    count++;
  });
  // this is a bit touchy on different shells:
  const maxLineWidth = dimensions.width ? dimensions.width : 168;
  console.log(columnify(data, {
    columnSplitter: '|',
    config: {
      Count: {
        maxWidth: 5
      },
      Timestamp: {
        maxWidth: 19
      },
      Msg: {
        maxWidth: maxLineWidth - 5 - 19 - 6
      }
    },
    columns: ['Count', 'Msg', 'Timestamp']
  }));
};

const printStreamTable = (argv, logStreams) => {
  const table = new Table({
    head: ['No', 'Group Name', 'Name', 'Created', 'Size']
  });
  let count = 1;
  logStreams.slice(0, argv.l).forEach((stream) => {
    const streamName = wrapper(10)(stream.logStreamName);
    const groupName = wrapper(10)(stream.logGroupName);
    const created = moment(stream.creationTime);
    const size = filesize(stream.storedBytes);
    table.push([count, groupName, streamName, created.format('YYYY-MM-DD HH:MM:SS'), size]);
    count = count + 1;
  });
  console.log(table.toString());
};

const printStreamColumns = (argv, logStreams) => {
  const dimensions = require('window-size');
  let count = 1;
  const data = [];
  logStreams.slice(0, argv.l).forEach((stream) => {
    const streamName = stream.logStreamName;
    const groupName = stream.logGroupName;
    const created = moment(stream.creationTime);
    const size = filesize(stream.storedBytes);
    data.push({
      No: count,
      'Group Name': groupName,
      Stream: streamName,
      Created: created.format('YYYY-MM-DD HH:MM:SS'),
      Size: size
    });
    count++;
  });
  const maxLineWidth = dimensions.width ? dimensions.width : 80;
  console.log(columnify(data, {
    config: {
      Stream: {
        maxWidth: maxLineWidth / 2
      }
    },
    columns: ['No', 'Group Name', 'Stream', 'Created', 'Size']
  }));
};

const printStreams = (argv, logStreams) => {
  if (argv.s) {
    logStreams = filter.filterAll(logStreams, {
      fieldName: 'logStreamName',
      expression: argv.s
    });
  }
  if (argv.t) {
    return printStreamColumns(argv, logStreams);
  }
  logStreams.slice(0, argv.l).forEach((stream) => {
    purdy({
      logGroupName: stream.logGroupName,
      logStreamName: stream.logStreamName,
      size: stream.storedBytes,
      created: moment(stream.creationTime).format('YYYY-MM-DD HH:MM:SS')
    });
  });
};

const printGroupsTable = (argv, groups) => {
  if (argv.f) {
    console.log('filtering by %s', argv.f);
    groups = filter.filterAll(groups, {
      fieldName: 'logGroupName',
      expression: argv.f
    });
  }
  const head = [];
  _.each({
    name: 'logGroupName',
    size: 'storedBytes',
    created: 'creationTime',
    arn: 'arn'
  }, (val, key) => {
    if (argv[key]) {
      head.push(_.capitalize(key));
    }
  });
  const table = new Table({ head });
  groups.slice(0, argv.l).forEach((group) => {
    const row = [];
    _.each({
      name: 'logGroupName',
      size: 'storedBytes',
      created: 'creationTime',
      arn: 'arn'
    }, (val, key) => {
      if (argv[key]) {
        switch (key) {
          case 'name':
            row.push(group[val].yellow);
            break;
          case 'created':
            row.push(moment(group[val]).format('YYYY-MM-DD HH:MM:SS').blue);
            break;
          default:
            row.push(group[val]);
            break;
        }
      }
    });
    table.push(row);
  });
  console.log(table.toString());
};

module.exports.printStreamTable = printStreamTable;
module.exports.printStreamColumns = printStreamColumns;
module.exports.printStreams = printStreams;
module.exports.printLogTable = printLogTable;
module.exports.printLog = printLog;
module.exports.printGroupsTable = printGroupsTable;
