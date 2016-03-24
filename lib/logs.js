'use strict';
const Table = require('cli-table');
const moment = require('moment');
const hi = require('human-interval');
const filesize = require('filesize');
const async = require('async');
const colors = require('colors');

const getStreams = (cwlogs, groups) => {
  if (!Array.isArray(groups)) {
    groups = [groups];
  }

  const table = new Table({
    head: ['No', 'Group Name', 'Name', 'Created', 'Size']
  });

  let count = 1;

  async.eachSeries(groups, (group, next) => {
    cwlogs.describeLogStreams({ logGroupName: group }, (err, data) => {
      if (err) {
        return next(err);
      }

      data.logStreams.forEach((stream) => {
        const name = stream.logStreamName;
        const created = moment(stream.creationTime);
        const size = filesize(stream.storedBytes);

        table.push([count, group, name, created.format('YYYY-MM-DD HH:MM:SS'), size]);

        count = count + 1;
      });

      next();
    });
  }, (err) => {
    if (err) throw err;

    console.log(table.toString());
  });
};

const getGroups = (cwlogs, showStreams) => {
  cwlogs.describeLogGroups({}, (err, data) => {
    if (err) throw err; // an error occurred

    if (showStreams) {
      const groups = [];
      data.logGroups.forEach((group) => {
        groups.push(group.logGroupName);
      });

      return getStreams(cwlogs, groups);
    }

    const table = new Table({
      head: ['Name', 'Created', 'Size']
    });

    data.logGroups.forEach((group) => {
      const name = group.logGroupName;

      const created = moment(group.creationTime);
      const size = filesize(group.storedBytes);
      table.push([name, created.format('YYYY-MM-DD HH:MM:SS'), size]);
    });

    console.log(table.toString());
  });
};

const getLogs = function(cwlogs, groupName, argv, nextToken, runningCount) {
  if (argv.limit === 0) {
    console.log('Limit reached');
    return console.log(`Retrieved ${runningCount} log entries`);
  }

  const params = {
    logGroupName: groupName,
    interleaved: true
  };

  if (argv.limit !== '*') {
    let limit = parseInt(argv.limit);

    if (limit <= 10000 && nextToken !== null) {
      argv.limit = 0;
    }

    if (limit > 10000) {
      argv.limit = (limit - 10000);
      limit = 10000;
    }

    params.limit = limit;
  }

  const dateFormat = argv.format;

  if (argv.since) {
    const sinceTime = moment(argv.since, dateFormat).valueOf();
    if (sinceTime > 0) {
      params.startTime = sinceTime;
    } else {
      console.log(`WARNING: Error parsing --since "${argv.since}" against format ${dateFormat}`);
    }
  }

  if (argv.until) {
    const endTime = moment(argv.until, dateFormat).valueOf();
    if (endTime > 0) {
      params.endTime = end; // ?
    } else {
      console.log(`WARNING: Error parsing --until "${argv.until}" against format ${dateFormat}`);
    }
  }
  if (argv.past) {
    const now = moment().valueOf();
    let offset;
    try {
      offset = hi(argv.past);
    } catch (e) {
      offset = false;
      console.log(` ${'WARNING:'.yellow} Error parsing --past  ${argv.past.red}`);
    }

    if (offset) {
      params.endTime = now;
      params.startTime = now - offset;
    }
  }

  if (argv.filterStatus) {
    params.filterPattern = `[..., status=${argv.filterStatus}, size, referrer, agent]`;
  }

  if (nextToken) {
    params.nextToken = nextToken;
  }

  if (!runningCount) {
    runningCount = 0;
  }

  cwlogs.filterLogEvents(params, (err, data) => {
    if (err) throw err;
    data.events.forEach((event) => {
      console.log(event.message);
    });

    runningCount = runningCount + data.events.length;

    if (data.nextToken) {
      return getLogs(cwlogs, groupName, argv, data.nextToken, runningCount);
    }
    console.log('');
    console.log(`Retrieved ${runningCount} log entries`);
  });
};

module.exports.streams = (aws, region, argv) => {
  const cwlogs = new aws.CloudWatchLogs({ region: region });
  return getStreams(cwlogs, [argv._[0]]);
};

module.exports.groups = (aws, region, argv) => {
  const cwlogs = new aws.CloudWatchLogs({ region: region });
  if (argv.groupName) {
    return getLogs(cwlogs, argv.groupName, argv);
  }
  getGroups(cwlogs, argv.streams);
};
