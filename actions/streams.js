/* eslint-disable no-console */
'use strict';
const Table = require('cli-table');
const moment = require('moment');
const filesize = require('filesize');
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

const getAllLogStreamsForGroup = async(cwlogs, group) => {
  const allLogStreams = [];
  const params = { logGroupName: group };
  let notDone = true;
  do {
    try {
      const data = await cwlogs.describeLogStreams(params).promise();
      _.each(data.logStreams, (stream) => {
        allLogStreams.push(_.defaults(stream, { logGroupName: group }));
      });
      if (data.nextToken) {
        params.nextToken = data.nextToken;
      } else {
        notDone = false;
      }
    } catch (e) {
      return allLogStreams;
    }
  } while (notDone);
  return allLogStreams;
};

const getStreams = async(cwlogs, groups) => {
  if (!Array.isArray(groups)) {
    groups = [groups];
  }
  let logStreams = [];
  const all = groups.reduce((memo, group) => {
    const promise = async() => {
      const result = await getAllLogStreamsForGroup(cwlogs, group);
      logStreams = logStreams.concat(result);
    };
    memo.push(promise());
    return memo;
  }, [])
  await Promise.all(all);
  return logStreams;
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

module.exports.handler = async(cwlogs, argv) => {
  logUtils.startSpinner();
  const logStreams = await getStreams(cwlogs, [argv.g]);
  logUtils.stopSpinner();
  print(argv, logStreams);
};
