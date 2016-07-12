#!/usr/bin/env node
'use strict';
const _ = require('lodash');
const yargs = require('yargs');
const groups = require('./actions/groups.js');
const streams = require('./actions/streams.js');
const tail = require('./actions/tail.js');
const search = require('./actions/search.js');
const log = require('./actions/log.js');
const completion = require('./lib/completion');

const initAWS = (argv) => {
  return require('./lib/commonAWS').init(argv);
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
.option('access_key', {
  describe: 'aws access key'
})
.option('secret_key', {
  describe: 'aws secret key'
})
.completion('completion', completion.handler)
.option('P', {
  alias: 'profile',
  describe: 'aws profile',
  default: 'default'
})
.option('region', {
  describe: 'aws region',
})
.strict()
.help('h')
.alias('h', 'help')
.env(true)
.argv;
