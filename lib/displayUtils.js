'use strict';
const moment = require('moment');
const _ = require('lodash');
const columnify = require('columnify');
const Table = require('cli-table');
const ttyTable = require('tty-table');
const purdy = require('purdy');
const dimensions = require('window-size');
const colors = require('colors');
const filesize = require('filesize');
const wrapper = require('wordwrap');

const printLogTable = (argv, logData) => {
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
      'Stream': streamName,
      'Created': created.format('YYYY-MM-DD HH:MM:SS'),
      'Size': size
    });
    count++;
  });
  const maxLineWidth = dimensions.width ? dimensions.width : 80;
  console.log(columnify(data, {
    config: {
      'Stream': {
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
    return printTable(argv, logStreams);
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
  const table = new Table({ head: head });
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
module.exports.printGroupsTable = printGroupsTable;
