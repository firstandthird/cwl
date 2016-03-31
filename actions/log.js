'use strict';
const prompt = require('prompt');
// const Table = require('cli-table');
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

let curPage = [];
let curParams = undefined;


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
  params.startTime = moment(new Date()).startOf('hour').toDate().getTime();
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
        console.log('building page...');
        callback();
      });
    },
    allDone
  );
};

const prevTime = () => {
  curParams.startTime = moment(curParams.startTime).subtract(1, 'hours').toDate().getTime();
};

const getPrevPage = (cwlogs, argv, callback) => {
  console.log('fetching prev page....');
  if (curParams.nextToken) {
    delete curParams.startTime;
    curPage = [];
    getLogsUntilLimitReached(cwlogs, argv.l, prevTime, callback);
  } else {
    curParams.endTime = _.last(curPage).timestamp;
    curPage = [];
    getLogsUntilLimitReached(cwlogs, argv.l, prevTime, callback);
  }
};
/*
todo: add support for 'next'
const nextTime = () => {
  curParams.startTime = moment(curParams.startTime).add(1, 'hours').toDate().getTime();
}
const getNextPage = (cwlogs, argv, callback) => {
  console.log("fetching next page...");
  if (curParams.nextToken) {
    delete curParams.startTime;
    curPage = [];
    getLogsUntilLimitReached(cwlogs, argv.l, nextTime, callback);
  } else {
    curParams.startTime = _.first(curPage).timestamp;
    curPage = [];
    getLogsUntilLimitReached(cwlogs, argv.l, nextTime, callback);
  }
};
*/

const getStartingPage = (cwlogs, argv, allDone) => {
  curParams = initParams(argv);
  getLogsUntilLimitReached(cwlogs, argv.l, prevTime, allDone);
};

const formatTimestamp = (timestamp) => {
  return moment(timestamp).format('MMMM Do, HH:mm:ss');
};

/*
todo: add support for table output:
const printPageTable = (page) => {
  const table = new Table({
    head: ['Timestamp', 'Stream', 'Message']
  })
  _.each(page, (event) => {
    table.push([
      formatTimestamp(event.timestamp),
      event.logStreamName,
      event.message
    ]);
  });
  console.log(table.toString());
}
const nextCommands = ['n', 'next'];
*/

const printPage = (page) => {
  _.each(page, (event) => {
    console.log(`${event.logStreamName} ${formatTimestamp(event.timestamp).red}  ${event.message.yellow}`
    );
  });
};
const quitCommands = ['q', 'quit', 'exit', '!'];
const prevCommands = ['', 'p', 'prev'];
const cmdMatches = (cmdList, cmd) => {
  return _.intersection(cmdList, [cmd.toLowerCase()]).length > 0;
};

// const promptMessage = `(n)ext/ (p)rev/ (q)uit, default is 'prev'`;
const promptMessage = '(p)rev/ (q)uit (hit enter for prev)';

module.exports.handler = (cwlogs, argv) => {
  prompt.message = '';
  prompt.delimiter = '>';

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
    // if (cmdMatches(nextCommands, result[promptMessage])) {
    //   getNextPage(cwlogs, argv, () => {
    //     printPage(curPage);
    //     prompt.get([promptMessage], handlePrompt);
    //   });
    // }
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
