'use strict';
const expect = require('chai').expect;
const sinon = require('mocha-sinon');
const aws = require('../lib/commonAWSStub');
const streams = require('../actions/streams.js');

describe('stream console printing', () => {
  // fake argv, these are normally set by yargs in index.js:
  let argv = {};
  let cwlogs = {};

  beforeEach( () => {
    cwlogs = aws();
    argv = {};
  });

  afterEach( () => {
  });

  it("prints out streams in table form", function() {
    this.sinon.stub(console, 'log');
    streams.handler(cwlogs, {
      l: 1000,
      g: 'prod-apps'
    });
    expect(console.log.called).to.be.true;
    expect(console.log.args[0][0]).to.include('fakeGroup');
    expect(console.log.args[0][0]).to.include('fakeStream1');
    expect(console.log.args[0][0]).to.include('fakeStream2');
    console.log.restore();
  });
});
