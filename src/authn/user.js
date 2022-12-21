import fetch from 'isomorphic-unfetch';
import dotenv from 'dotenv';
dotenv.config();

import authn_providers_m from "./providers";
const AUTHN_PROVIDERS = authn_providers_m();


const serialize_user = (user, done) => {
  // console.log('serialize_user', user);
  done(null, user)
};


const deserialize_user = (user, done) => {
  // console.log('deserialize_user', user);
  done(null, user)
};


const current_user_props = async (req, res) => {
  const response = {};
  let authenticated = !!(req.session.passport && req.session.passport.user);
  if(authenticated) {
    delete req.session.authn_error;
  }
  try {
    const user = req.session.passport.user;
    const profile = await check_current_user(req);
    authenticated = profile && profile.authenticated;
    if (authenticated) {
      const provider = AUTHN_PROVIDERS[user.authn.iss_id];
      const page_props = provider.user_profile_to_client_page_props(profile);
      Object.assign(response, page_props);
    }
  } catch (e) {
    authenticated = false;
    response.authn_error = e.toString();
  }
  response.authenticated = authenticated;
  if(!authenticated && req.session.authn_error) {
    response.authn_error = req.session.authn_error.toString();
  }
  res.json(response);
};


const check_current_user = async (req) => {
  let authenticated = !!(req.session.passport && req.session.passport.user);
  if (authenticated) {
    const user = req.session.passport.user;
    const provider = AUTHN_PROVIDERS[user.authn.iss_id];
    let profile;
    try {
      profile = await fetch(process.env.LTC_LAYMAN_USER_PROFILE_URL, {
        headers: provider.get_authn_headers(user),
      }).then( r => r.json());
      authenticated = profile.authenticated;
    } catch (e) {
      console.log('AUTOMATICALLY LOGGING OUT, because of error when communicating with Layman\'s Current User endpoint.');
      await delete_current_user(req);
      req.logout((err) => {
        if(err) {
          console.error(err);
        }
        throw e;
      });
    }
    if(authenticated) {
      return profile;
    } else {
      console.log('AUTOMATICALLY LOGGING OUT, because Layman claimed the user is not authenticated anymore');
      await delete_current_user(req);
      req.logout((err) => {
        if(err) {
          console.error(err);
        }
      });
    }
  }
  return null;
};


const delete_current_user = async (req) => {
  let authenticated = !!(req.session.passport && req.session.passport.user);
  if (authenticated) {
    const user = req.session.passport.user;
    const provider = AUTHN_PROVIDERS[user.authn.iss_id];
    try {
      await fetch(process.env.LTC_LAYMAN_USER_PROFILE_URL, {
        method: 'DELETE',
        headers: provider.get_authn_headers(user),
      }).then( r => r.json());
    } catch (e) {
      console.log('Error during DELETE Current User', e);
    }
  }
  return null;
};


export default {
  serialize_user,
  deserialize_user,
  current_user_props,
  check_current_user,
  delete_current_user,
}
