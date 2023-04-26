import fetch from 'isomorphic-unfetch';
import dotenv from 'dotenv';
dotenv.config();


const user_profile = (access_token, done) => {
  fetch(process.env.LTC_LAYMAN_USER_PROFILE_URL, {
    headers: {
      'Authorization': `Bearer ${access_token}`,
    },
  }).then( r => r.json() ).then(profile => {
        // console.log('userProfile callback', profile);
        done(null, profile);
  })
};


const ensure_username = async (access_token, profile) => {
  if (!profile['username']) {
    profile = await fetch(`${process.env.LTC_LAYMAN_USER_PROFILE_URL}?adjust_username=true`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    }).then( r => r.json());
  }
  return profile;
};


const get_authn_headers = (user) => {
  return {
    Authorization: `Bearer ${user.authn.access_token}`,
  }
};


const user_profile_to_client_page_props = (profile) => {
  return {
    username: profile.username,
    display_name: profile.claims.email,
  }
};


const refresh_authn_info = async (oauth2_token_url, client_id, client_secret, req, user) => {
  // console.log('oauth2 refresh_authn_info');
  if (user.authn.refreshing) {
    // console.log('ALREADY REFRESHING');
    let i = 0;
    const timer = setTimeout(() => {
      user = req.session.passport && req.session.passport.user;
      if (!user || !user.authn.refreshing || i > 100) {
        clearTimeout(timer);
      }
    }, 100);
    if (i > 100) {
      throw Error('OAuth2 refresh timeout reached!');
    }
    return;
  }
  const d = new Date();
  const seconds = Math.round(d.getTime() / 1000);
  user.authn.refreshing = true;
  // https://issues.liferay.com/browse/OAUTH2-167
  let new_info;
  try {
    new_info = await fetch(oauth2_token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id,
        client_secret,
        refresh_token: user.authn.refresh_token,
      })
    }).then( r => r.json());
  } catch(e) {
    console.log(e);
    console.log('AUTOMATICALLY LOGGING OUT, because of error when refreshing authn info');
    const user_util = require('./user').default;
    await user_util.delete_current_user(req);
    req.logout((err) => {
      if(err) {
        console.error(err);
      }
      req.session.authn_error = 'Error when refreshing authn info';
    });
    return;
  }
  // console.log('refresh_authn_info', seconds, new_info);
  if(typeof seconds !== "number") {
    throw Error(`seconds is not number, but ${seconds}`);
  }
  if(typeof new_info.expires_in !== "number") {
    throw Error(`new_info.expires_in is not number, but ${new_info.expires_in}`);
  }
  user.authn.access_token = new_info.access_token;
  user.authn.iat = seconds; // it's not precise, but should be safe enough
  user.authn.exp = seconds + new_info.expires_in; // it's not precise, but should be safe enough
  user.authn.refresh_token = new_info.refresh_token;
  delete user.authn.refreshing;
};


const refresh_authn_info_if_needed = async (oauth2_token_url, client_id, client_secret, req) => {
  // console.log('oauth2 refresh_authn_info_if_needed');
  if(req.session.passport && req.session.passport.user) {
    const user = req.session.passport.user;
    const exp = user.authn.exp;
    if(typeof exp !== "number") {
      throw Error(`user.authn.exp is not number, but ${exp}`);
    }
    const incoming_timestamp = req.incoming_timestamp;
    if(typeof incoming_timestamp !== "number") {
      throw Error(`req.incoming_timestamp is not number, but ${exp}`);
    }
    if (exp - 10 <= incoming_timestamp) {
      await refresh_authn_info(oauth2_token_url, client_id, client_secret, req, user);
    }
  }
};


export default {
  user_profile,
  ensure_username,
  get_authn_headers,
  user_profile_to_client_page_props,
  refresh_authn_info,
  refresh_authn_info_if_needed,
};