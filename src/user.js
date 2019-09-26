const rp = require('request-promise-native');
const rp_errors = require('request-promise-native/errors');

const serialize_user = (user, done) => {
  console.log('serialize_user', user);
  done(null, user)
};
const deserialize_user = (user, done) => {
  console.log('deserialize_user', user);
  done(null, user)
};

const current_user_props = async (auth_providers, req, res) => {
  console.log('/current-user-props START');
  const authenticated = !!(req.session.passport && req.session.passport.user);
  const response = {
    authenticated,
  };
  if (authenticated) {
    const user = req.session.passport.user;
    const provider = auth_providers[user.authn.iss_id];
    let profile;
    try {
      profile = await rp({
        uri: process.env.LAYMAN_USER_PROFILE_URL,
        headers: provider.get_authn_headers(user),
        json: true
      });
      response.authenticated = profile.authenticated;
    } catch (e) {
      response.authenticated = false;
      response.authn_error = e.toString();
      if (e instanceof rp_errors.StatusCodeError && e.statusCode === 403) {
        const json = e.error;
        if (json.code === 32 && json.sub_code === 9) {
          console.log('WANT TO REFRESH AUTHN INFO');
          // TODO implement liferay.refresh_authn_info
          provider.refresh_authn_info(user)

        // TODO 2
        // use automatically refresh_authn_info also in HTTP proxy in server.js
        // or some level up
        }
      }



    }
    if (response.authenticated) {
      const page_props = provider.user_profile_to_client_page_props(profile);
      Object.assign(response, page_props);
    } else {
      if (req.session.passport && req.session.passport.user) {
        console.log('AUTOMATICALLY LOGGING OUT');
        req.logout();
      }
    }
  }
  console.log('/current-user-props END', response);
  res.json(response);
}



module.exports = {
  serialize_user,
  deserialize_user,
  current_user_props,
};