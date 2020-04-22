#!/usr/bin/env node
'use strict';
const _ = require('lodash');
const yargs = require('yargs');
const groups = require('./actions/groups.js');
const streams = require('./actions/streams.js');
const tail = require('./actions/tail.js');
const search = require('./actions/search.js');
const cleanup = require('./actions/cleanup.js');
const log = require('./actions/log.js');

const initAWS = (argv) => {
  return require('aws-creds')(require('aws-sdk'), 'CloudWatchLogs', argv);
};

const handler = (actionHandler, argv) => {
  if (argv.P) {
    argv.profile = argv.P;
  }
  const aws = initAWS(argv);
  actionHandler(aws, argv);
};

const commands = [
  {
    name: 'groups',
    desc: 'list cloudwatch log groups',
    builder: groups.builder,
    handler: groups.handler
  },
  {
    name: 'streams',
    desc: 'list streams for a group',
    builder: streams.builder,
    handler: streams.handler
  },
  {
    name: 'tail',
    desc: 'grab the last 10 mins of logs and then fetch every few seconds',
    builder: tail.builder,
    handler: tail.handler
  },
  {
    name: 'search',
    desc: ' search group of logs for a specific query. can include streamname too.',
    builder: search.builder,
    handler: search.handler
  },
  {
    name: 'cleanup',
    desc: "remove streams that haven't had logs in the last X days",
    builder: cleanup.builder,
    handler: cleanup.handler
  },
  {
    name: 'logs',
    desc: 'paginate through all logs starting from newest to oldest, press enter to show the next 50',
    builder: log.builder,
    handler: log.handler
  }
];

// register each command with yargs:
_.each(commands, (c) => {
  yargs.command(c.name, c.desc, c.builder, (argv) => {
    handler(c.handler, argv);
  });
});

yargs.demand(1)
.option('accessKey', {
  describe: 'aws access key'
})
.option('secretKey', {
  describe: 'aws secret key'
})
.option('P', {
  alias: 'profile',
  describe: 'aws profile',
  default: false
})
.strict()
.help('h')
.alias('h', 'help')
.env(false)
.argv;
