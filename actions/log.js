'use strict';
const prompt = require('prompt');
// const Table = require('cli-table');
const moment = require('moment');
const _ = require('lodash');
const async = require('async');
const colors = require('colors');
const logUtils = require('../lib/logUtils');
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

let curPage = [];
let curParams = undefined;
let curDirection = 'newest';
let prevOldest = undefined;
let prevYoungest = undefined;

const initParams = (argv) => {
  const params = {
    logGroupName: argv.g
  };
  // todo: let them specify a date range:
  // if (argv.b) {
  //   params.startTime = moment(argv.b).getTime();
  // } else {
  //   params.startTime = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
  // }
  params.startTime = moment(new Date()).subtract(1, 'hours').toDate().getTime();
  if (argv.s.length > 0) {
    params.logStreamNames = argv.s;
  }
  return params;
};

const getLogsUntilLimitReached = (cwlogs, limit, iterator, allDone) => {
  async.whilst(
    () => {
      const notDone = curParams.nextToken || curPage.length < limit;
      if (notDone === false) {
        curPage = curPage.slice(0, limit);
        prevOldest = _.first(curPage).timestamp;
        prevYoungest = _.last(curPage).timestamp;
      }
      return notDone;
    },
    (callback) => {
      cwlogs.filterLogEvents(curParams, (err, data) => {
        if (err) {
          return callback(err);
        }
        if (data.nextToken) {
          curParams.nextToken = data.nextToken;
        } else {
          delete curParams.nextToken;
          iterator();
        }
        curPage = _.sortBy(_.union(curPage, data.events), (o) => { return -o.timestamp;});
        console.log('building page...%s', curPage.length);
        if (curParams.startTime) {
          console.log(moment(curParams.startTime).toString());
        }
        if (curParams.endTime) {
          console.log(moment(curParams.endTime).toString());
        }
        callback();
      });
    },
    allDone
  );
};

const printParams = (msg) => {
  console.log(msg);
  logUtils.getTimestamp(curParams.startTime);
  logUtils.getTimestamp(curParams.endTime);
}

const prevTime = () => {
  curParams.startTime = moment(prevYoungest).subtract(1, 'hours').toDate().getTime();
  curParams.endTime = prevYoungest;
};

const getPrevPage = (cwlogs, argv, callback) => {
  console.log('fetching prev page....');
  if (curParams.nextToken && curDirection == 'prev') {
    printParams("get by prev token");
  } else {
    prevTime();
    printParams("get by prev time")
  }
  curDirection = 'prev';
  curPage = [];
  getLogsUntilLimitReached(cwlogs, argv.l, prevTime, callback);
};

const nextTime = () => {
  curParams.startTime = prevOldest;
  curParams.endTime = moment(prevOldest).add(1, 'hours').toDate().getTime();
}

// next is everything older than the oldest
// prev is everything younger than the youngest

const getNextPage = (cwlogs, argv, callback) => {
  console.log("fetching next page...");
  if (curParams.nextToken && curDirection === 'next') {
    printParams("get by next token")
  } else {
    // filter by the current least-recent event:
    nextTime();
    printParams("get by next time");
  }
  curDirection = 'next';
  curPage = [];
  getLogsUntilLimitReached(cwlogs, argv.l, nextTime, callback);
};

const getStartingPage = (cwlogs, argv, allDone) => {
  curParams = initParams(argv);
  curDirection = 'prev';
  getLogsUntilLimitReached(cwlogs, argv.l, prevTime, allDone);
};


/*
todo: add support for table output:
const printPageTable = (page) => {
  const table = new Table({
    head: ['Timestamp', 'Stream', 'Message']
  })
  _.each(page, (event) => {
    table.push([
      logUtils.getTimestamp(event.timestamp),
      event.logStreamName,
      event.message
    ]);
  });
  console.log(table.toString());
}
*/

const quitCommands = ['q', 'quit', 'exit', '!'];
const prevCommands = ['', 'p', 'prev'];
const nextCommands = ['n', 'next'];
const cmdMatches = (cmdList, cmd) => {
  return _.intersection(cmdList, [cmd.toLowerCase()]).length > 0;
};

const promptMessage = `  `;
// const promptMessage = '(p)rev/ (q)uit (hit enter for prev)';

module.exports.handler = (cwlogs, argv) => {
  prompt.message = '';
  prompt.delimiter = '';
  const printPage = (page) => {
    logUtils.printLogSet(argv, page);
  };

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
        printPage(curPage);
        prompt.get([promptMessage], handlePrompt);
      });
    }
    // todo: add support for 'next'
    if (cmdMatches(nextCommands, result[promptMessage])) {
      getNextPage(cwlogs, argv, () => {
        printPage(curPage);
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
