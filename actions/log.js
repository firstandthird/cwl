'use strict';
const prompt = require('prompt');
const moment = require('moment');
const _ = require('lodash');
const async = require('async');
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
  pp: {
    alias: 'prettyPrint',
    default: true,
    describe: 'attempt to print log ',
    type: 'boolean'
  },
  ps: {
    alias: 'printStreams',
    default: false,
    describe: 'print the log stream, only used when prettyPrint is set to false',
    type: 'boolean'
  },
  s: {
    alias: 'streams',
    default: [],
    describe: 'comma-separated list of streams to view',
    type: 'array'
  },
};

// as we fetch pages further back in time,
//  we will store them here:
const pages = [];
// index of the current page in pages[]
let index = -1;
let curPage = [];
let curParams = undefined;
let curYoungest = undefined;

const addPage = (page) => {
  pages.push(page);
};

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

//helpful debugging method:
// const printParams = (msg) => {
//   console.log(msg);
//   console.log(`start: ${logUtils.getTimestamp(curParams.startTime)}`);
//   console.log(`end: ${logUtils.getTimestamp(curParams.endTime)}`);
//   console.log(`next: ${curParams.nextToken}`);
// };

const buildNewPage = (cwlogs, limit, iterator, allDone) => {
  async.whilst(
    () => {
      const notDone = curParams.nextToken || curPage.length < limit;
      if (notDone === false) {
        curPage = curPage.slice(0, limit);
        curYoungest = _.last(curPage).timestamp;
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
          // clear this so we know not to query it next time:
          delete curParams.nextToken;
          iterator();
        }
        curPage = _.sortBy(_.union(curPage, data.events), (o) => {
          return -o.timestamp;
        });
        // printParams("building page " + curPage.length)
        if (curPage.length > 0) {
          curYoungest = _.last(curPage).timestamp;
        }
        callback();
      });
    },
    allDone
  );
};
const iterateToPreviousTime = () => {
  curParams.startTime = moment(curYoungest).subtract(1, 'hours').toDate().getTime();
  curParams.endTime = curYoungest;
};
// const iterateToNextTime = () => {
  // everything between the oldest event and now:
  // curParams.startTime = _.first(pages[index]).timestamp;
  // curParams.endTime = new Date().getTime();
// }

const getStartingPage = (cwlogs, argv, allDone) => {
  curParams = initParams(argv);
  buildNewPage(cwlogs, argv.l, iterateToPreviousTime, allDone);
};


const getPrevPage = (cwlogs, argv, callback) => {
  if (!curParams.nextToken) {
    const nextIndex = index + 1;
    if (nextIndex > pages.length - 1) {
      // get a new page of events from AWS
      // that is prior to the last page we got:
      iterateToPreviousTime();
      curPage = [];
      buildNewPage(cwlogs, argv.l, iterateToPreviousTime, () => {
        index += 1;
        addPage(curPage);
        callback();
      });
    } else {
      index += 1;
      curPage = pages[index];
      callback();
    }
  }
};

const getNextPage = (cwlogs, argv, callback) => {
  if (!curParams.nextToken) {
    const nextIndex = index - 1;
    if (nextIndex < 0) {
      console.log('`>>>> Reached beginning of log');
      callback();
      // todo: query for new logs and add them to the front of the list
      // curPage = [];
      // buildNewPage(cwlogs, argv.l, iterateToNextTime, (res) => {
      //   pages.unshift(curPage);
      //   index = 0;
      //   callback();
      // });
    } else {
      index -= 1;
      curPage = pages[index];
      callback();
    }
  }
};

const quitCommands = ['q', 'quit', 'exit', '!'];
const prevCommands = ['', 'p', 'prev'];
const nextCommands = ['n', 'next'];
const cmdMatches = (cmdList, cmd) => {
  return _.intersection(cmdList, [cmd.toLowerCase()]).length > 0;
};

const promptMessage = '   ';
// const promptMessage = '(p)rev/ (q)uit (hit enter for prev)';

module.exports.handler = (cwlogs, argv) => {
  prompt.message = '';
  prompt.delimiter = '';
  console.log(' p (or enter) for prev page of logs, n for next page, q to exit');
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
  };

  getStartingPage(cwlogs, argv, (err) => {
    if (err) {
      throw err;
    }
    addPage(curPage);
    index++;
    printPage(curPage);
    prompt.start();
    prompt.get([promptMessage], handlePrompt);
  });
};
