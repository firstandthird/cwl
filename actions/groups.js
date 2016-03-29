/* eslint-disable no-console */
'use strict';
const purdy = require('purdy');
const Table = require('cli-table');
const _ = require('lodash');
const filter = require('../lib/filter');
const moment = require('moment');
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

const print = (argv, groups) => {
  if (argv.f) {
    console.log("filtering by %s", argv.f)
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
  const table = new Table({
    head: head
  });
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

module.exports.handler = (cwlogs, argv) => {
  const params = {
  };
  cwlogs.describeLogGroups(params, (err, data) => {
    if (err) {
      throw err;
    }
    print(argv, data.logGroups);
  });
};
