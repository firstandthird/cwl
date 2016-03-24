#!/usr/bin/env node
'use strict';

const conf = require('./lib/bootstrap');
const action = conf.action;
const aws = conf.aws;
const region = conf.region;
const argv = conf.argv;

const actions = {
  groups: (aws, region, argv) => {
    const groups = require('./lib/logs').groups;
    groups(aws, region, argv);
  },
  streams: (aws, region, argv) => {
    const streams = require('./lib/logs').streams;
    streams(aws, region, argv);
  },
  tail: (aws, region, argv) => {
    if (argv.length === 2) {
      const groups = require('./lib/groups');
      groups(cwLogs);
    } else {
      const logs = require('./lib/tail-logs');
      const logGroupName = process.env.AWS_GROUP_NAME || process.argv[3];
      const logStreamName = process.env.AWS_STREAM_NAME || process.argv[4];
      const cwLogs = new aws.CloudWatchLogs({ region: region });
      logs(cwLogs, logGroupName, logStreamName);
    }
  },
  search: (aws, region, argv) => {

  },
  metric: (aws, region, argv) => {

  },
  help: () => {
  }
}

if (actions[action]) {
  actions[action](aws,region,argv);
} else {
  actions.help();
}
