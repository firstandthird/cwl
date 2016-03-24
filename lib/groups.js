/* eslint-disable no-console */
'use strict';
module.exports = (cwlogs) => {
  const params = {
  };
  cwlogs.describeLogGroups(params, (err, data) => {
    if (err) {
      throw err;
    }
    data.logGroups.forEach((group) => {
      console.log(group.logGroupName);
    });
  });
};
