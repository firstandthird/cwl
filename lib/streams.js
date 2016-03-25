/* eslint-disable no-console */
'use strict';
const Table = require('cli-table');
const moment = require('moment');
const filesize = require('filesize');
const async = require('async');
const colors = require('colors');

const getStreams = (cwlogs, groups) => {
  if (!Array.isArray(groups)) {
    groups = [groups];
  }

  const table = new Table({
    head: ['No', 'Group Name', 'Name', 'Created', 'Size']
  });

  let count = 1;

  async.eachSeries(groups, (group, next) => {
    cwlogs.describeLogStreams({ logGroupName: group }, (err, data) => {
      if (err) {
        return next(err);
      }

      data.logStreams.forEach((stream) => {
        const name = stream.logStreamName;
        const created = moment(stream.creationTime);
        const size = filesize(stream.storedBytes);

        table.push([count, group, name, created.format('YYYY-MM-DD HH:MM:SS'), size]);

        count = count + 1;
      });

      next();
    });
  }, (err) => {
    if (err) throw err;

    console.log(table.toString());
  });
};

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
  g: {
    alias: 'group',
    describe: 'Group you want to list',
    default: 'prod-apps',
  },
};

module.exports.handler = (argv) => {
  getStreams(require('./commonAWS')(argv), [argv.g]);
};
