const rp = require('request-promise-native');

module.exports = {
  user_profile: (iss, access_token, done) => {
    const options = {
      uri: process.env.LAYMAN_USER_PROFILE_URL,
      headers: {
        'AuthorizationIssUrl': iss,
        'Authorization': `Bearer ${access_token}`,
      },
      json: true // Automatically parses the JSON string in the response
    };

    rp(options)
        .then((profile) => {
          console.log('userProfile callback', profile);
          done(null, profile);
        });
  },

  ensure_username: async (iss, access_token, profile) => {
    if (!profile['username']) {
      var options = {
        method: 'PATCH',
        uri: `${process.env.LAYMAN_USER_PROFILE_URL}?adjust_username=true`,
        headers: {
          'AuthorizationIssUrl': iss,
          'Authorization': `Bearer ${access_token}`,
        },
      };
      profile = await rp(options);
    }
    return profile;
  },
};