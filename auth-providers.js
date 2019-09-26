require('dotenv').config();

const liferay = require('./src/liferay');


const providers = {};

module.exports = () => {




  const LIFERAY_PROVIDER_KEY = 'oauth2-liferay';
  if (process.env.LIFERAY_OAUTH2_CLIENT_ID && !providers[LIFERAY_PROVIDER_KEY]) {
    const iss_id = LIFERAY_PROVIDER_KEY;
    const iss = process.env.LIFERAY_OAUTH2_AUTH_URL;

    const Strtg = require('passport-oauth2').Strategy;

    //read user profile
    Strtg.prototype.userProfile = (access_token, done) => {
      return liferay.user_profile(iss, access_token, done);
    };

    providers[iss_id] = {
      id: iss_id,
      name: 'Liferay',
      options: {
        scope: ['liferay-json-web-services.everything.read.userprofile']
      },
      Strategy: Strtg,
      strategy_options: {
        clientID: process.env.LIFERAY_OAUTH2_CLIENT_ID,
        clientSecret: process.env.LIFERAY_OAUTH2_SECRET,
        authorizationURL: process.env.LIFERAY_OAUTH2_AUTH_URL,
        tokenURL: process.env.LIFERAY_OAUTH2_TOKEN_URL,
        callbackURL: process.env.LIFERAY_OAUTH2_CALLBACK_URL
      },
      strategy_callback: async (req, accessToken, refreshToken, extraParams, profile, done) => {
        profile = await liferay.ensure_username(iss, accessToken, profile);
        console.log('strategy_callback', accessToken, refreshToken, extraParams, profile);


        // if needed, we can save anything else to session
        // it will be available only on server side and saved in REDIS with key "sess:<cookie connect.sid>"
        // req.session[LIFERAY_PROVIDER_KEY] = {
        //   accessToken: accessToken
        // };
        // however it's not deleted on req.logout() !!!

        // TODO get expiration times and save it to session (or maybe add it to GET current-user response)
        // TODO save tokens to REDIS for given user & provider
        // see https://github.com/iaincollins/next-auth/blob/f52ccae5a58c5b8b6f0140604618626bf1a21af4/src/passport-strategies.js#L79,L287
        // and relates functions.* calls
        // probably rename /rest/<username>/* to /rest/users/<username>/* (breaking change !!!)

        return done(null, {
          ...liferay.user_profile_to_client_page_props(profile),
          authn: {
            iss_id: iss_id,
            iss: iss,
            sub: profile.claims.sub,
            access_token: accessToken,
            refresh_token: refreshToken,
          }
        });
      },
      get_authn_headers: liferay.get_authn_headers,
      user_profile_to_client_page_props: liferay.user_profile_to_client_page_props,
      refresh_authn_info: (user) => {
        return liferay.refresh_authn_info(
            process.env.LIFERAY_OAUTH2_TOKEN_URL,
            process.env.LIFERAY_OAUTH2_CLIENT_ID,
            process.env.LIFERAY_OAUTH2_SECRET,
            user
        );
      },
    };

  }

  return providers
};