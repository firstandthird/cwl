'use strict';
const expect = require('chai').expect;
const sinon = require('mocha-sinon');
const aws = require('../lib/commonAWSStub');
const search = require('../actions/search.js');
const moment = require('moment');
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

});
