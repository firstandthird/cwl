'use strict';
const expect = require('chai').expect;
const sinon = require('mocha-sinon');
const aws = require('../lib/commonAWSStub');
const tail = require('../actions/tail.js');

describe('tail console printing', () => {
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
    tail.handler(cwlogs, {
      l: 1000,
      g: 'prod-apps',
      s: [],
    });
    expect(console.log.called).to.be.true;
    expect(console.log.args[0][0]).to.include('Tailing logs for group');
    expect(console.log.args[1][0]).to.include('girgol');
    expect(console.log.args[2][0]).to.include('blorb');
    expect(console.log.args[2][0]).to.include('timestamp');
    console.log.restore();
  });
});
