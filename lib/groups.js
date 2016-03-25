/* eslint-disable no-console */
'use strict';
const purdy = require('purdy');
const Table = require('cli-table');
const _ = require('lodash');

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 1000,
    describe: 'limit the # of groups to show (default 1000)'
  },
  r: {
    alias: 'region',
    describe: 'AWS Region to use',
    default: 'us-east-1',
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
    describe: 'Show the storedBytes for each group (default is true)',
    default: true,
    type: Boolean
  },
  n: {
    alias: 'name',
    describe: 'Show the name of the group (default is true)',
    default: true,
    type: Boolean
  },
};

const print = (argv, groups) => {
  groups.forEach((group) => {
    const toShow = {};
    _.each({
      name: 'logGroupName',
      size: 'storedBytes',
      created: 'creationTime',
      arn: 'arn'
    }, (val, key) => {
      if (argv[key]) {
        toShow[val] = group[val];
      }
    });
    purdy(toShow);
  });
};

const listGroups = (cwlogs, argv) => {
  const params = {
  };
  cwlogs.describeLogGroups(params, (err, data) => {
    if (err) {
      throw err;
    }
    print(argv, data.logGroups);
  });
};

module.exports.handler = (argv) => {
  listGroups(require('./commonAWS')(argv), argv);
};
