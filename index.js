'use strict';
const _ = require('lodash');
const yargs = require('yargs');
const groups = require('./actions/groups.js');
const streams = require('./actions/streams.js');
const tail = require('./actions/tail.js');

const initAWS = (argv) => {
  return require('./lib/commonAWS')({ argv });
};

const handler = (handler, argv) => {
  const aws = initAWS(argv);
  // todo: test security credentials here or later?
  handler(aws, argv);
};
// major commands, each requires an inited interface to AWS.CloudWatch:
const commands = [
  {
    name: 'groups',
    desc: 'list cloudwatch log groups',
    builder: groups.builder,
    handler: (argv) => {
      handler(groups.handler, argv);
    }
  },
  {
    name: 'streams',
    desc: 'list streams for a group',
    builder: streams.builder,
    handler: (argv) => {
      handler(streams.handler, argv);
    }
  },
  {
    name: 'tail',
    desc: 'grab the last 10 mins of logs and then fetch every few seconds',
    builder: tail.builder,
    handler: (argv) => {
      handler(tail.handler, argv);
    }
  }
];

// register each command with yargs:
_.each(commands, (c) => {
  yargs.command(c.name, c.desc, c.builder, c.handler);
});

yargs.demand(1)
.strict()
.help('h')
.alias('h', 'help')
.env(true)
.default('profile', 'default')
.argv;
