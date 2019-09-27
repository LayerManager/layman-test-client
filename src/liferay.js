import rp from 'request-promise-native';

export default {
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
          // console.log('userProfile callback', profile);
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

  get_authn_headers: (user) => {
    return {
      AuthorizationIssUrl: user.authn.iss,
      Authorization: `Bearer ${user.authn.access_token}`,
    }
  },

  user_profile_to_client_page_props: (profile) => {
    return {
      username: profile.username,
      display_name: profile.claims.email,
    }
  },

  refresh_authn_info: async (oauth2_token_url, client_id, client_secret, user) => {
    // https://issues.liferay.com/browse/OAUTH2-167
    const new_info = await rp({
      uri: oauth2_token_url,
      method: 'POST',
      form: {
        grant_type: 'refresh_token',
        client_id,
        client_secret,
        refresh_token: user.authn.refresh_token,
      },
      json: true
    });
    user.authn.access_token = new_info.access_token;
    user.authn.refresh_token = new_info.refresh_token;
  },
};