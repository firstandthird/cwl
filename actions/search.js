'use strict';
const prompt = require('prompt');
const streamsLib = require('./streams.js');
const async = require('async');
const logUtils = require('../lib/logUtils');
const displayUtils = require('../lib/displayUtils.js');
const _ = require('lodash');
const humanInterval = require('human-interval');

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 10000,
    describe: 'limit the # of log events to show (default 1000)'
  },
  i: {
    alias: 'interactive',
    default: false,
    describe: 'after each page of logs is shown, will prompt if you want to search the next N log events (where N is specified by the -l/--limit option)'
  },
  statusCode: {
    alias: 'statusCode',
    default: false,
    describe: 'statusCode XXX is equivalent to -q "[..., status=XXX, size, referrer, agent]" '
  },
  g: {
    alias: 'group',
    default: 'prod-apps',
    describe: 'specify the log event to search in'
  },
  s: {
    alias: 'streams',
    default: [],
    describe: 'comma-separated list of streams to search in',
    type: 'array'
  },
  p: {
    alias: 'purdy',
    default: false,
    describe: 'set to true to pretty-print as JSON, otherwise prints as table'
  },
  q: {
    alias: 'query',
    describe: 'an AWS RegEx to filter against'
  },
  last: {
    describe: 'a human-interval expression specifying how far back to begin searching (see https://github.com/rschmukler/human-interval for examples)'
  },
  around: {
    alias: 'around',
    describe: 'search around the indicated time, expressed using human-interval'
  },
  range: {
    alias: 'range',
    describe: 'used with --around, human-interval range around the indicated time in which to search',
    default: false
  }
};

let lastToken = false;
// in interactive mode, so long as we have unseen logs
// we will keep prompting:
let hasUnseenLogs = true;
// we will use this to keep track of events we haven't seen:
let lastEventTimeShown = false;

const getParamsForEventQuery = (argv, streams) => {
  const params = {
    logGroupName: argv.g,
    interleaved: true
  };
  // specify which streams to search based on user preference:
  if (argv.s.length > 0) {
    params.logStreamNames = streams;
  }
  if (argv.q) {
    params.filterPattern = `${argv.q}`;
  }
  if (argv.statusCode) {
    params.filterPattern = `[..., status_code=${argv.statusCode}, size, referrer, agent]`;
  }
  if (argv.last) {
    params.startTime = new Date().getTime() - humanInterval(argv.last);
  }
  if (argv.around) {
    const distance = humanInterval(argv.around);
    const centralTime = new Date().getTime() - distance;
    const range = argv.range ? humanInterval(argv.range) : distance / 10;
    params.startTime = centralTime - range;
    params.endTime = centralTime + range;
    console.log('start time %s to %s', displayUtils.getTimestamp(params.startTime), displayUtils.getTimestamp(params.endTime))
  }
  // if possible only fetch from the last log shown (interactive mode)
  if (lastEventTimeShown) {
    params.endTime = lastEventTimeShown;
  // otherwise if there's a token from a previous fetch start there:
  } else if (lastToken) {
    params.nextToken = lastToken;
  }
  return params;
};

let count = 0;
let iterations = 0;
const getLogEventsForStream = (cwlogs, argv, streams, allDone) => {
  const params = getParamsForEventQuery(argv, streams);
  let allStreamEvents = [];
  let foundEnoughEventsToDisplay = false;
  lastEventTimeShown = false;
  // keep querying AWS until there are no more events:
  async.until(
    () => {
      return foundEnoughEventsToDisplay;
    },
    (done) => {
      cwlogs.filterLogEvents(params, (err, eventData) => {
        if (err) {
          return allDone(err);
        }
        allStreamEvents = allStreamEvents.concat(eventData.events);
        if (eventData.nextToken) {
          params.nextToken = eventData.nextToken;
          lastToken = params.nextToken;
        } else {
          lastToken = false;
        }
        // sort by newest:
        allStreamEvents = _.orderBy(allStreamEvents, (item) => {
          return item.timestamp;
        }).reverse();
        // this must keep fetching until we have argv.limit
        // event logs, or until there are no more left
        // to search
        if (allStreamEvents.length >= argv.l) {
          foundEnoughEventsToDisplay = true;
          // save the time of the last one:
          lastEventTimeShown = _.last(allStreamEvents.slice(0, argv.l)).timestamp;
        } else if (lastToken) {
          foundEnoughEventsToDisplay = false;
        } else {
          foundEnoughEventsToDisplay = true;
        }

        done();
      });
    },
    () => {
      displayUtils.printLogTable(argv, allStreamEvents, count);
      // in interactive mode we will need to know if
      // there were unseen logs that can still be displayed:
      if (allStreamEvents.length < argv.l) {
        hasUnseenLogs = false;
      }
      // if AWS passed us a cursor, there are still more events to search:
      if (lastToken) {
        hasUnseenLogs = true;
      }
      // update the count of events we've seen:
      iterations++;
      count = (iterations * argv.l) + 1;
      // reset the table of events:
      allStreamEvents = [];
      allDone(null, allStreamEvents);
    }
  );
};

const doFetch = (cwlogs, argv, prevToken, fetchDone) => {
  async.auto({
    streams: (done) => {
      if (argv.s.length > 0) {
        return done(null, argv.s);
      }
      console.log(`searching all streams in group ${argv.g} (this may take a while)`);
      streamsLib.getStreams(cwlogs, [argv.g], (err, streams) => {
        done(err, streams);
      });
    },
    events: ['streams', (results, done) => {
      getLogEventsForStream(cwlogs, argv, results.streams, done);
    }]
  }, fetchDone);
};


module.exports.handler = (cwlogs, argv) => {
  if (!argv.q && !argv.statusCode) {
    return console.log('must specify either -q/--query or a --statusCode');
  }
  // non-interactive mode will just do a fetch and then exit:
  if (!argv.i) {
    logUtils.startSpinner();
    doFetch(cwlogs, argv, null, (err) => {
      logUtils.stopSpinner();
      if (err) {
        throw err;
      }
    });
  // interactive mode will fetch and if there are more out there,
  // will prompt the user to display more entries
  } else {
    const handlePrompt = (err) => {
      if (err) {
        logUtils.stopSpinner();
        return;
      }
      logUtils.startSpinner();
      doFetch(cwlogs, argv, null, (err2) => {
        if (err2) {
          throw err2;
        }
        if (hasUnseenLogs) {
          prompt.get(['(hit enter for more results)'], handlePrompt);
        } else {
          console.log('No more entries found');
          prompt.stop();
          logUtils.stopSpinner();
        }
      });
    };
    prompt.start();
    doFetch(cwlogs, argv, null, (err) => {
      if (err) {
        throw err;
      }
      if (hasUnseenLogs) {
        prompt.get(['(hit enter for more results)'], handlePrompt);
      }
    });
  }
};
