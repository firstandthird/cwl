
const getTags = (argv, log) => {
  try {
    const msg = JSON.parse(log.message);
    return _.keys(msg.tags).join(',');
  } catch (exc) {
    return 'None';
  }
};

const getMsg = (argv, log) => {
  try {
    const msg = JSON.parse(log.message);
    return JSON.stringify(msg.message);
  } catch (exc) {
    return log.message;
  }
};

module.exports.getTags = getTags;
module.exports.getMsg = getMsg;
