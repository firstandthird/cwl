// stub version of commonAWS, for testing:
'use strict';

// some mock data:
const fakeGroups = [{
    logGroupName: 'fakeGroup1',
    creationTime: 12345,
    arn: 'arn:aws:blah:',
    storedBytes: 54321
  },
  {
    logGroupName: 'fakeGroup2',
    creationTime: 54321,
    arn: 'arn:aws:blah:',
    storedBytes: 12345
  }
];

const fakeStreams = [{
  logStreamName: 'fakeStream1',
  logGroupName: 'fakeGroup',
  creationTime: 12341234,
  storedBytes: 123421
  },
  {
    logStreamName: 'fakeStream2',
    logGroupName: 'fakeGroup',
    creationTime: 43214321,
    storedBytes: 54321
  }
];

const fakeGroupLogs = [
  {
    logStreamName: 'mockLogStream',
    timestamp: 1466612103751,
    message: '{"timestamp":"2016-06-22T16:15:03.751Z","tags":{"debug":true,"frotz":true},"message":{"rezrov": 1,"girgol":{"blorple":true}}}',
    ingestionTime: 1466612105646,
    eventId: '32706542830832009361377689646633066825542170365602955265' },
  { logStreamName: 'mockLogStream',
    timestamp: 1466612183252,
    message: '{"timestamp":"2016-06-22T16:16:23.251Z","tags":{"debug":true,"blorb":true},"message":{"igram": 1,"jindak":{"":true}}}',
    ingestionTime: 1466612185629,
    eventId: '32706544603763553389760760118557256062314077895186776065' },
  { logStreamName: 'mockLogStream',
    timestamp: 1466612415214,
    message: '{"timestamp":"2016-06-22T16:20:15.214Z","tags":{"debug":true,"liskon":true},"message":{"throck": 1,"pulver":{"c4bd05fd06":true}}}',
    ingestionTime: 1466612415641,
    eventId: '32706549776689011131321165553532950330595143889783685122'
}];

// a fake aws-sdk.CloudWatchLogs object we can use for testing
class FakeCloudwatchLogs {
    constructor() {
      this.region = 'us-east-1';
    }
    describeLogGroups(params, callback) {
      callback(null, { logGroups: fakeGroups });
    }
    describeLogStreams(params, callback) {
      callback(null, { logStreams: fakeStreams });
    }
    filterLogEvents(params, callback) {
      callback(null, { events : fakeGroupLogs });
    }
};

module.exports = (argv) => {
  return new FakeCloudwatchLogs();
};
