'use strict';
const _ = require('lodash');
const commonAWS = require('./commonAWS');
const groups = require('../actions/groups');
const streams = require('../actions/streams');

const getStaticRegions = () => {
  return [
    'us-east-1',
    'us-west-1',
    'us-west-2',
    'ap-south-1',
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-southeast-1',
    'ap-southeast-2',
    'eu-central-1',
    'eu-west-1',
    'sa-east-1'
  ];
};

const getHumanIntervals = () => {
  return [
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'
  ];
};

const getProfiles = () => {
  return commonAWS.extractConfigData();
};

const getGroups = (argv, done) => {
  const cwlogs = commonAWS.init(argv);
  groups.listAllGroups(cwlogs, argv, (data) => {
    const ret = [];
    _.each(data, (item) => {
      ret.push(item.logGroupName);
    });
    done(ret);
  });
};

const getStreams = (argv, done) => {
  const groupArgs = [];
  if (argv.g) {
    groupArgs.push(argv.g);
  } else if (argv.groups) {
    groupArgs.push(argv.groups);
  }
  //todo: if a group is not specified do we list all streams for all groups?
  const cwlogs = commonAWS.init(argv);
  streams.getStreams(cwlogs, groupArgs, (err, data) => {
    if (err) {
      return done([]);
    }
    const ret = [];
    _.each(data, (item) => {
      ret.push(item.logStreamName);
    });
    done(ret);
  });
};

module.exports.handler = (current, argv, done) => {
  if (['-r', '--region'].indexOf(current) > -1) {
    return done(getStaticRegions());
  }
  if (['-last', '--last', '-around', '--around', '-range', '--range'].indexOf(current) > -1) {
    return done(getHumanIntervals());
  }
  if (['-P', '--profile'].indexOf(current) > -1) {
    return done(_.keys(getProfiles()));
  }
  if (['-g', '--group'].indexOf(current) > -1) {
    getGroups(argv, done);
  }
  if (['-s', '--streams'].indexOf(current) > -1) {
    getStreams(argv, done);
  } else {
    return done(['groups', 'logs', 'search', 'streams', 'tail', 'completion']);
  }
};
