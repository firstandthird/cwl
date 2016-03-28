#!/usr/bin/env node
'use strict';
const _ = require('lodash');
const yargs = require('yargs');
const groups = require('./actions/groups.js')
const streams = require('./actions/streams.js')
const tail = require('./actions/tail.js')

const initAWS = (argv) => {
  return require('./lib/commonAWS')({argv});
};

// major commands, each requires an inited interface to AWS.CloudWatch:
const commands = [
  {
    name: 'groups',
    desc: 'list cloudwatch log groups',
    builder: groups.builder,
    handler: (argv) => {
      groups.handler(initAWS(argv), argv);
    }
  },
  {
    name: 'streams',
    desc: 'list streams for a group',
    builder: streams.builder,
    handler: (argv) => {
      streams.handler(initAWS(argv), argv);
    }
  },
  {
    name: 'tail',
    desc: 'grab the last 10 mins of logs and then fetch every few seconds',
    builder: tail.builder,
    handler: (argv) => {
      tail.handler(initAWS(argv), argv);
    }
  }
];

// register each command with yargs:
_.each(commands, (c) => {
  yargs.command(c.name, c.desc, c.builder, c.handler);
});
let usageString =  `$0 <command> where command is one of:

`;
// usageString += _.values(_.mapValues(commands, 'name')).join(', ');
yargs
.demand(1)
.strict()
// .usage(usageString)
.help('h')
.alias('h', 'help')
.env('AWS_ACCESS_KEY_ID')
.env('AWS_SECRET_ACCESS_KEY')
yargs.argv;
