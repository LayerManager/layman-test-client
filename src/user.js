import rp from 'request-promise-native';
import rp_errors from 'request-promise-native/errors';

const serialize_user = (user, done) => {
  console.log('serialize_user', user);
  done(null, user)
};
const deserialize_user = (user, done) => {
  console.log('deserialize_user', user);
  done(null, user)
};

const _request_with_refresh = async (provider, user, rp_opts) => {
  try {
    const resp = await rp(rp_opts);
    return resp;
  } catch(e) {
    if (e instanceof rp_errors.StatusCodeError && e.statusCode === 403) {
      const json = e.error;
      if (json.code === 32 && json.sub_code === 9) {
        try {
          await provider.refresh_authn_info(user);
          rp_opts.headers = rp_opts.headers || {};
          rp_opts.headers = {
            ...rp_opts.headers,
            ...provider.get_authn_headers(user),
          };
          const resp = await rp(rp_opts);
          return resp;
        } catch (e2) {
          throw e2;
        }

      // TODO refresh token in HTTP proxy if expiration time is close (e.g. 10 seconds, but always < then lifetime of access token)
      // e.g. because of chunk upload ...
      }
    }
    throw e;
  }
};

const current_user_props = async (auth_providers, req, res) => {
  const response = {};
  let authenticated = !!(req.session.passport && req.session.passport.user);
  try {
    const user = req.session.passport.user;
    const provider = auth_providers[user.authn.iss_id];
    const profile = await check_current_user(auth_providers, req);
    authenticated = profile && profile.authenticated;
    if (authenticated) {
      const page_props = provider.user_profile_to_client_page_props(profile);
      Object.assign(response, page_props);
    }
  } catch (e) {
    authenticated = false;
    response.authn_error = e.toString();
  }
  response.authenticated = authenticated;
  res.json(response);
};


const check_current_user = async (auth_providers, req) => {
  let authenticated = !!(req.session.passport && req.session.passport.user);
  if (authenticated) {
    const user = req.session.passport.user;
    const provider = auth_providers[user.authn.iss_id];
    let profile;
    try {
      const rp_opts = {
        uri: process.env.LAYMAN_USER_PROFILE_URL,
        headers: provider.get_authn_headers(user),
        json: true
      };
      profile = await _request_with_refresh(provider, user, rp_opts);
      authenticated = profile.authenticated;
    } catch (e) {
      console.log('AUTOMATICALLY LOGGING OUT');
      req.logout();
      throw e;
    }
    if(authenticated) {
      return profile;
    } else {
      console.log('AUTOMATICALLY LOGGING OUT');
      req.logout();
    }
  }
  return null;
};



export default {
  serialize_user,
  deserialize_user,
  current_user_props,
  check_current_user,
}
