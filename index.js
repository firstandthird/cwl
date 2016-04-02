#!/usr/bin/env node
'use strict';
const _ = require('lodash');
const yargs = require('yargs');
const groups = require('./actions/groups.js');
const streams = require('./actions/streams.js');
const tail = require('./actions/tail.js');
const search = require('./actions/search.js');
const cleanup = require('./actions/cleanup.js');

const initAWS = (argv) => {
  return require('./lib/commonAWS')({ argv });
};

const handler = (handler, argv) => {
  const aws = initAWS(argv);
  handler(aws, argv);
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
  }

];

// register each command with yargs:
_.each(commands, (c) => {
  yargs.command(c.name, c.desc, c.builder, (argv) => {
    handler(c.handler, argv);
  });
});

yargs.demand(1)
.strict()
.help('h')
.alias('h', 'help')
.env(true)
.default('profile', 'default')
.argv;
