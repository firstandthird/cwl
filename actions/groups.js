/* eslint-disable no-console */
'use strict';
const logUtils = require('../lib/logUtils');
const displayUtils = require('../lib/displayUtils');
const async = require('async');

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 50,
    describe: 'limit the # of groups to show (default 1000)'
  },
  arn: {
    alias: 'arn',
    describe: 'Show the arn for each group',
    default: false,
    type: Boolean
  },
  c: {
    alias: 'created',
    describe: 'Show the creationTime for each group',
    default: false,
    type: Boolean
  },
  s: {
    alias: 'size',
    describe: 'Show the storedBytes for each group ',
    default: true,
    type: Boolean
  },
  n: {
    alias: 'name',
    describe: 'Show the name of the group ',
    default: true,
    type: Boolean
  },
  f: {
    alias: 'filter',
    describe: 'Filter groups to show by a regular expression',
    default: undefined,
    type: String
  },
};

const listAllGroups = (cwlogs, argv, callback) => {
  let params = {
    limit: argv.l
  };
  let allGroups = [];
  let foundEnoughEventsToDisplay = false;
  async.until(
    () => {
      return foundEnoughEventsToDisplay;
    },
    (done) => {
      cwlogs.describeLogGroups(params, (err, data) => {
        if (err) {
          throw err;
        }
        allGroups = allGroups.concat(data.logGroups);
        if (data.nextToken) {
          params.nextToken = data.nextToken;
          foundEnoughEventsToDisplay = false;
        } else {
          foundEnoughEventsToDisplay = true;
        }
        done();
      });
    },
    () => {
      callback(allGroups);
    });
};

// exported to make it available to other modules:
module.exports.listAllGroups = listAllGroups;

module.exports.handler = (cwlogs, argv) => {
  logUtils.startSpinner();
  listAllGroups(cwlogs, argv, (data) => {
    logUtils.stopSpinner();
    displayUtils.printGroupsTable(argv, data);
  });
};
