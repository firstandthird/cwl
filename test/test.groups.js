'use strict';
const expect = require('chai').expect;
const sinon = require('mocha-sinon');
const aws = require('../lib/commonAWSStub');
const groups = require('../actions/groups.js');

describe('group console printing', () => {
  // fake argv, these are normally set by yargs in index.js:
  let argv = {};
  let cwlogs = {};

  beforeEach( () => {
    cwlogs = aws();
    argv = {};
  });

  afterEach( () => {
  });

  it("prints out groups in table form", function() {
    this.sinon.stub(console, 'log');
    groups.handler(cwlogs, {
      l: 1000,
      arn: true,
      created: true,
      size: true,
      name: true
    });
    expect(console.log.called).to.be.true;
    expect(console.log.args[0][0]).to.include('fakeGroup1');
    expect(console.log.args[0][0]).to.include('fakeGroup2');
    expect(console.log.args[0][0]).to.include('Size');
    expect(console.log.args[0][0]).to.include('Created');
    console.log.restore();
  });
});
