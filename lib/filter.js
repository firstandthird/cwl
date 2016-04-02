'use strict';

const _ = require('lodash');

const filterDate = (data, filterDirective) => {
  return _.filter(data, (d) => {
    if (filterDirective.op === 'greater') {
      return _.get(d, filterDirective.fieldName) > filterDirective.date;
    } else if (filterDirective.op === 'less') {
      return _.get(d, filterDirective.fieldName) < filterDirective.date;
    }
  });
};

module.exports.filterDate = filterDate;

const filterExpression = (data, filterDirective) => {
  // console.log("filtering by %s", filterDirective.expression);
  const re = new RegExp(filterDirective.expression);
  return _.filter(data, (d) => {
    return _.first(re.exec(_.get(d, filterDirective.fieldName)));
  });
};
module.exports.filterOne = (data, filterOption) => {
  return _.first(filterExpression([data], filterOption));
};

// returns items that match ALL filters:
module.exports.filterAll = (data, filterOptions) => {
  // if no options provided then no filter:
  if (!filterOptions) {
    return data;
  }
  if (filterOptions.length) {
    let allMatchResults = [];
    _.each(filterOptions, (option) => {
      allMatchResults = _.intersection(allMatchResults, filterExpression(data, option));
    });
    return allMatchResults;
  }
  // otherwise filter by the options:
  return filterExpression(data, filterOptions);
};
