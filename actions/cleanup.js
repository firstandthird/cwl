const streams = require('./streams');
const filter = require('../lib/filter');
const moment = require('moment');
const _ = require('lodash');
const colors = require('colors');
const prompt = require('prompt');
const async = require('async');
module.exports.builder = {
  g: {
    alias: 'group',
    default: 'prod-apps',
    describe: 'specify the group to clean up'
  },
  d: {
    alias: 'days',
    default: 7,
    describe: 'specify the group to clean up'
  },
};

const getUserConfirmation = (msg, callback) => {
  prompt.message = msg;
  prompt.get(['confirm'], (err, result) => {
    callback(result.confirm === 'y')
  });
};

const deleteLogStream = (cwlogs, logGroupName, streamGroupName, done) => {
  cwlogs.deleteLogStream({
    logGroupName, streamGroupName
  }, (err) => {
    done(err);
  });
};

const getExpiredLogStreams = (cwlogs, group, days, done) => {
  streams.getStreams(cwlogs, group, (err, streams) => {
    if (err) {
      return done(err);
    }
    expiredStreams = filter.filterDate(streams, {
      fieldName: 'lastEventTimestamp',
      op: 'less',
      date: moment(new Date()).subtract(days, 'days').toDate().getTime()
    });
    // go through each one and get confirmation
    async.eachSeries(expiredStreams, (stream, callback) => {
      getUserConfirmation(`Stream ${stream.logStreamName.red} most recent update was ${moment(stream.lastEventTimestamp).toString().yellow}
      press y to delete or any other key to skip`,
        (wasConfirmed) => {
          if (wasConfirmed) {
            console.log("was confirmed");
            callback();
            // deleteLogStream(cwlogs, group, stream.logStreamName, callback);
          } else {
            console.log('Skipping without deleting');
            callback();
          }
        }
      );
    },
  () => {
      console.log('All done!');
  });
  });
};

module.exports.handler = (cwlogs, argv) => {
  prompt.start();
  getExpiredLogStreams(cwlogs, argv.g, argv.d, (err) => {
    if (err) {
      console.log(err);
    }
  })
};
