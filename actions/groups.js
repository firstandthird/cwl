/* eslint-disable no-console */
'use strict';
const _ = require('lodash');
const filter = require('../lib/filter');
const moment = require('moment');
const logUtils = require('../lib/logUtils');
const displayUtils = require('../lib/displayUtils');

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 1000,
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

module.exports.handler = (cwlogs, argv) => {
  const params = {
  };
  logUtils.startSpinner();
  cwlogs.describeLogGroups(params, (err, data) => {
    if (err) {
      throw err;
    }
    logUtils.stopSpinner();
    displayUtils.printGroupsTable(argv, data.logGroups);
  });
};
