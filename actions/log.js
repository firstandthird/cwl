'use strict';
const prompt = require('prompt');
const Table = require('cli-table');
const moment = require('moment');
const _ = require('lodash');
const async = require('async');
const colors = require('colors');

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 50,
    describe: 'limit the # of log events to get per page (default 50)'
  },
  g: {
    alias: 'group',
    default: 'prod-apps',
    describe: 'specify the group to view'
  },
  s: {
    alias: 'streams',
    default: [],
    describe: 'specify the streams to view',
    type: 'array'
  },
};

const getNextPage = (cwlogs, argv, callback) => {
  callback();
};


const getPrevPage = (cwlogs, argv, curParams, allDone) => {
};

const initParams = (argv) => {
  const params = {
    logGroupName: argv.g,
    limit: argv.l,
  }
  // if (argv.b) {
  //   params.startTime = moment(argv.b).getTime();
  // } else {
  //   params.startTime = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
  // }
  params.startTime = argv.b;
  if (argv.s.length > 0) {
    params.logStreamNames = argv.s;
  }
  return params;
}

let curPage = [];
let curParams = undefined;

const getStartingPage = (cwlogs, argv, allDone) => {
  curParams = initParams(argv);
  async.whilst(
    () => {
      return curPage.length < argv.l;
    },
    (callback) => {
      cwlogs.filterLogEvents(curParams, (err, data) => {
        if (err) {
          return callback(err);
        }
        curPage = _.union(curPage, data.events);
        console.log(`building page, %s events...${curPage.length} `);
        callback();
      });
    },
    allDone
  );
};

const printPageTable = (page) => {
  const table = new Table({
    head: ['Timestamp', 'Stream', 'Message']
  })
  _.each(page, (event) => {
    table.push([
      moment(event.timestamp).format('MM-DD HH:MM'),
      event.logStreamName,
      event.message
    ]);
  });
  console.log(table.toString());
}

const printPage = (page) => {
  _.each(page, (event) => {
    console.log(`${event.logStreamName} ${moment(event.timestamp).format('MM-DD HH:MM').red}:  ${event.message.yellow}`
    );
  });
}
const quitCommands = ['q', 'quit', 'exit', '!'];
const prevCommands = ['', 'p', 'prev'];
const nextCommands = ['n', 'next'];
const cmdMatches = (cmdList, cmd) => {
  return _.intersection(cmdList, [cmd.toLowerCase()]).length > 0;
}

const promptMessage = `(n)ext/ (p)rev/ (q)uit, default is 'prev'`;

module.exports.handler = (cwlogs, argv) => {
  prompt.message = '';
  prompt.delimiter = '>'
  const params = initParams(argv);

  const handlePrompt = (err, result) => {
    if (err) {
      throw err;
    }
    if (cmdMatches(quitCommands, result[promptMessage])) {
      prompt.stop();
      return process.exit(0);
    }
    if (cmdMatches(prevCommands, result[promptMessage])) {
      return getPrevPage(cwlogs, argv, () => {
        prompt.get([promptMessage], handlePrompt);
      });
    }
    if (cmdMatches(nextCommands, result[promptMessage])) {
      getNextPage(cwlogs, argv, () => {
        prompt.get([promptMessage], handlePrompt);
      });
    }
    prompt.get([promptMessage], handlePrompt);
  };

  getStartingPage(cwlogs, argv, (err) => {
    if (err) {
      throw err;
    }
    printPage(curPage);
    prompt.get([promptMessage], handlePrompt);
  });

};
