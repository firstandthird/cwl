/* eslint-disable no-console */
'use strict';
const Table = require('cli-table');
const moment = require('moment');
const filesize = require('filesize');
const async = require('async');
const colors = require('colors');
const purdy = require('purdy');
const _ = require('lodash');
const filter = require('../lib/filter');
const logUtils = require('../lib/logUtils');
const printTable = (argv, logStreams) => {
  const table = new Table({
    head: ['No', 'Group Name', 'Name', 'Created', 'Size']
  });
  let count = 1;
  logStreams.slice(0, argv.l).forEach((stream) => {
    const streamName = stream.logStreamName;
    const groupName = stream.logGroupName;
    const created = moment(stream.creationTime);
    const size = filesize(stream.storedBytes);
    table.push([count, groupName, streamName, created.format('YYYY-MM-DD HH:MM:SS'), size]);
    count = count + 1;
  });
  console.log(table.toString());
};

const print = (argv, logStreams) => {
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

const getAllLogStreamsForGroup = (cwlogs, group, callback) => {
  const allLogStreams = [];
  const params = { logGroupName: group };
  let isDone = false;
  async.until(
    () => {
      return isDone;
    },
    (done) => {
      cwlogs.describeLogStreams(params, (err, data) => {
        if (err) {
          return callback(err, allLogStreams);
        }
        _.each(data.logStreams, (stream) => {
          allLogStreams.push(_.defaults(stream, { logGroupName: group }));
        });
        if (data.nextToken) {
          params.nextToken = data.nextToken;
        } else {
          isDone = true;
        }
        done();
      });
    },
    () => {
      callback(null, allLogStreams);
    }
  );
};

const getStreams = (cwlogs, groups, callback) => {
  if (!Array.isArray(groups)) {
    groups = [groups];
  }
  let logStreams = [];
  async.eachSeries(groups, (group, next) => {
    getAllLogStreamsForGroup(cwlogs, group, (err, result) => {
      logStreams = logStreams.concat(result);
      next();
    });
  }, (err) => {
    if (err) {
      console.log(err);
    }
    callback(err, logStreams);
  });
};

module.exports.getStreams = getStreams;

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 1000,
    describe: 'limit the # of groups to show (default 1000)'
  },
  g: {
    alias: 'group',
    describe: 'Group you want to list',
    demand: true
  },
  t: {
    alias: 'table',
    describe: 'Print in table form',
    default: true,
    type: 'boolean'
  },
  s: {
    alias: 'stream',
    describe: 'Filter streams to show by a regular expression',
    default: undefined
  },
};

module.exports.handler = (cwlogs, argv) => {
  logUtils.startSpinner();
  getStreams(cwlogs, [argv.g], (err, logStreams) => {
    if (err) throw err;
    logUtils.stopSpinner();
    print(argv, logStreams);
  });
};
