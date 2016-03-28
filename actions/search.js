
module.exports.builder = {
  l: {
    alias: 'limit',
    default: 1000,
    describe: 'limit the # of groups to show (default 1000)'
  },
  g: {
    alias: 'group',
    default: 'prod-app',
    describe: 'specify the group to search in'
  },
  s: {
    alias: 'stream',
    default: '',
    describe: 'specify the stream to search in'
  },
  q: {
    alias: 'query',
    default: '*',
    describe: 'a Javascript RegEx to filter against'
  }
};

module.exports.handler = {

};
