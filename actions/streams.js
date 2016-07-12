/* eslint-disable no-console */
'use strict';
const async = require('async');
const _ = require('lodash');
const logUtils = require('../lib/logUtils');
const displayUtils = require('../lib/displayUtils.js');

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
    console.log(group)
    getAllLogStreamsForGroup(cwlogs, group, (err, result) => {
      if (err) {
        throw err;
      }
      logStreams = logStreams.concat(result);
      next();
    });
  }, (err) => {
    if (err) {
      throw err;
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
    // displayUtils.printStreamTable(argv, logStreams);
    displayUtils.printStreamColumns(argv, logStreams);
  });
};
