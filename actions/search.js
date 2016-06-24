'use strict';
const prompt = require('prompt');
const streamsLib = require('./streams.js');
const async = require('async');
const moment = require('moment');
const _ = require('lodash');
const logUtils = require('../lib/logUtils');
const displayUtils = require('../lib/displayUtils.js');

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 1000,
    describe: 'limit the # of log events to show (default 1000)'
  },
  i: {
    alias: 'interactive',
    default: false,
    describe: 'after each page of logs is shown, will prompt if you want to search the next N log events (where N is specified by the -l/--limit option)'
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
    describe: 'an AWS RegEx to filter against',
    demand: true
  }
};

const getParamsForEventQuery = (argv, streams) => {
  const params = {
    logGroupName: argv.g,
    limit: argv.l,
    startTime: 0
  };
  // specify which streams to search based on user preference:
  if (argv.s.length > 0) {
    params.logStreamNames = streams;
  }
  if (argv.q) {
    params.filterPattern = argv.q;
  }
  // if there's a token from a previous fetch start there:
  if (lastToken) {
    params.nextToken = lastToken;
  }
  return params;
};

let lastToken = false;

const getLogEventsForStream = (cwlogs, argv, streams, allDone) => {
  const params = getParamsForEventQuery(argv, streams);
  const allStreamEvents = [];
  let isDone = false;
  // keep querying AWS until there are no more events:
  async.until(
    () => {
      return isDone;
    },
    (done) => {
      cwlogs.filterLogEvents(params, (err, eventData) => {
        if (err) {
          return allDone(err);
        }
        // put a page out there for this:
        displayUtils.printLogTable(argv, eventData.events);
        if (eventData.nextToken) {
          params.nextToken = eventData.nextToken;
          lastToken = params.nextToken;
        } else {
          lastToken = false;
        }
        isDone = true;
        done();
      });
    },
    () => {
      allDone(null, allStreamEvents);
    }
  );
};

const doFetch = (cwlogs, argv, lastToken, fetchDone) => {
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
    const handlePrompt = () => {
      doFetch(cwlogs, argv, null, (err) => {
        if (lastToken) {
          prompt.get(['(hit enter for more results)'], handlePrompt);
        } else {
          console.log('No more entries found');
          prompt.stop();
        }
      })
    };
    prompt.start();
    doFetch(cwlogs, argv, null, (err) => {
      if (lastToken) {
        prompt.get(['(hit enter for more results)'], handlePrompt);
      }
    });
  }
};
