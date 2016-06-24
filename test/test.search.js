'use strict';
const expect = require('chai').expect;
const sinon = require('mocha-sinon');
const aws = require('../lib/commonAWSStub');
const search = require('../actions/search.js');

describe('search console printing', () => {
  // fake argv, these are normally set by yargs in index.js:
  let argv = {};
  let cwlogs = {};

  beforeEach( () => {
    cwlogs = aws();
    argv = {};
  });

  afterEach( () => {
  });

  it("prints out a query in table form", function() {
    this.sinon.stub(console, 'log');
    search.handler(cwlogs, {
      l: 1000,
      g: 'prod-apps',
      s: [],
      p: false,
      q: "{ $.tags.debug is true }"
    });
    expect(console.log.called).to.be.true;
    expect(console.log.args[0][0]).to.equal('searching all streams in group prod-apps (this may take a while)');
    expect(console.log.args[1][0]).to.include('rezrov');
    expect(console.log.args[1][0]).to.include('timestamp');
    console.log.restore();
  });
});

describe('search sort by newest', () => {
  // fake argv, these are normally set by yargs in index.js:
  let argv = {};
  let cwlogs = {};

  beforeEach( () => {
    cwlogs = aws();
    argv = {};
  });

  afterEach( () => {
  });

  it("sorts by the newest log event", function() {
    // subtitute in a special log events function that gives
    // us a longer list:
    cwlogs.filterLogEvents = cwlogs._____filterLogEventsSortByDate;
    this.sinon.stub(console, 'log');
    search.handler(cwlogs, {
      l: 1000,
      g: 'prod-apps',
      s: [],
      p: false,
      q: "{ $.tags.debug is true }"
    });
    expect(console.log.called).to.be.true;
    expect(console.log.args[0][0]).to.equal('searching all streams in group prod-apps (this may take a while)');
    expect(console.log.args[1][0]).to.include('margi');
    /*
    2016-06-22T16:15:03.751Z
    2016-06-22T16:15:03.751Z
    */
    for (var i = 0; i < console.logs.args[1][0].split('\n').length; i++) {
      console.logs.args[1][0].split('\n')[i]
    }
    console.log.restore();
  });
});
