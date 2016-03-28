'use strict';
/*
 data is a collection of Objects
 filterOptions is an object or list of objects like:
 {
 fieldName: string or list of strigns indicating field to filter by,
 expression: corresponding JS RegExp or list of RegExps to match against
}
 */
const _ = require('lodash');

const filterExpression = (data, filterDirective) => {
  // console.log("filtering by %s", filterDirective.expression);
  const re = new RegExp(filterDirective.expression)
  return _.filter(data, (d) => {
    return _.first(re.exec(_.get(d, filterDirective.fieldName)));
  });
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
