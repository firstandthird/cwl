/* eslint-disable no-console */
'use strict';
const purdy = require('purdy');

module.exports = (cwlogs, logGroupName, logStreamName) => {
  const initialParams = {
    logGroupName,
    interleaved: true
  };

  if (logStreamName) {
    initialParams.logStreamNames = [logStreamName];
  }

  let count = 0;
  const max = 300;
  const defaultInterval = 5 * 1000;
  const timePadding = 10 * 1000;
  const seenEvents = {};

  const getLogs = (params, startTime, limit) => {
    params.startTime = new Date().getTime() - startTime - timePadding;

    params.limit = limit || null;

    //console.log(`Fetching logs since ${new Date(params.startTime).toTimeString()} (${count}/${max})`);

    cwlogs.filterLogEvents(params, (error, data) => {
      if (error) {
        console.log(error);
      }

      if (data.events.length !== 0) {
        data.events.forEach((event) => {
          if (seenEvents[event.eventId]) {
            return;
          }
          const d = new Date(event.timestamp);
          const localTime = d.toLocaleTimeString();
          if (event.message[0] === '{') {
            const json = JSON.parse(event.message);
            json.localTime = localTime;
            purdy(json);
          } else {
            console.log(`${localTime}: ${event.message}`);
          }
          seenEvents[event.eventId] = true;
        });
      }

      params.nextToken = data.nextForwardToken;

      count++;
      if (count === max) {
        console.log('--- All Done ---');
        process.exit(0);
      }
      setTimeout(() => {
        getLogs(params, defaultInterval);
      }, defaultInterval);
    });
  };

  getLogs(initialParams, 1000 * 60 * 30, 30);
};
