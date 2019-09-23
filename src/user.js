const rp = require('request-promise-native');

const serialize_user = (user, done) => {
  console.log('serialize_user', user);
  done(null, user)
};
const deserialize_user = (user, done) => {
  console.log('deserialize_user', user);
  done(null, user)
};

module.exports = {
  serialize_user,
  deserialize_user,
};