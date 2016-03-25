#!/usr/bin/env node
'use strict';

require('yargs')
.command(
  'groups',
  'list cloudwatch log groups ',
  require('./lib/groups.js')
).command(
  'streams',
  'list streams for a group',
  require('./lib/streams.js')
).command(
  'tail',
  'grab the last 10 mins of logs and then fetch every few seconds',
  require('./lib/tail.js')
)
.help('h')
.alias('h', 'help')
.argv;
