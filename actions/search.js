const streams = require('./streams.js');

module.exports.builder = {
  l: {
    alias: 'limit',
    default: 1000,
    describe: 'limit the # of groups to show (default 1000)'
  },
  g: {
    alias: 'group',
    default: 'prod-app',
    describe: 'specify the group to search in'
  },
  s: {
    alias: 'stream',
    default: '',
    describe: 'specify the stream to search in'
  },
  q: {
    alias: 'query',
    default: '*',
    describe: 'a Javascript RegEx to filter against'
  }
};


const print = (argv, logStreams) => {
  if (argv.t) {
    return printTable(argv, logStreams);
  }
  console.log(logStreams);
  if (argv.f) {
    // console.log("filtering by %s", argv.f)
    // logStreams = filter.filterAll(logStreams, {
    //   fieldName: 'logStreamName',
    //   expression: argv.f
    // });
  }
  logStreams.slice(0, argv.l).forEach((logStreams) => {
    const toShow = {};
    _.each({
      // name: 'logGroupName',
      // size: 'storedBytes',
      // created: 'creationTime',
      // arn: 'arn'
    }, (val, key) => {
      if (argv[key]) {
        toShow[val] = group[val];
      }
    });
    purdy(toShow);
  });
};

const getStreams = (cwlogs, groups, argv) => {
  if (!Array.isArray(groups)) {
    groups = [groups];
  }
  let logStreams = [];
  async.eachSeries(groups, (group, next) => {
    cwlogs.describeLogStreams({ logGroupName: group }, (err, data) => {
      if (err) {
        return next(err);
      }
      _.each(data.logStreams, (stream) => {
        logStreams.push(_.defaults(stream, { logGroupname: group }));
      });
      next();
    });
  }, (err) => {
    if (err) throw err;
    print(argv, logStreams);
  });
};

const getLogEvents = (cwlogs, groupName, streamName, argv, done) => {
  let params = {
    logGroupName: gropuName,
    logStreamName: streamName
  };

  if (argv.l) {
    params.limit = argv.l;
  }
  // if (argv.b) {
  //   params.startTime: moment(argv.b).toDate().getTime()
  // }
  // if (argv.e) {
  //   params.startTime: moment(argv.e).toDate().getTime()
  // }
  cwlogs.getLogEvents(params, done);
};

const handleReturnedEvents = (err, events) => {
  console.log(events);
};

module.exports.handler = (cwlogs, argv) => {
  async.auto({
    streamNames: (done) => {
      cwlogs.describeLogStreams({ logGroupName: group }, (err, data) =>
    }
  },
handleReturnedEvents);
};
