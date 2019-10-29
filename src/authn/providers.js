import dotenv from 'dotenv';
dotenv.config();

import oauth2 from './oauth2';


const providers = {};


export default () => {

  const LIFERAY_PROVIDER_KEY = 'oauth2-liferay';
  if (process.env.OAUTH2_LIFERAY_CLIENT_ID && !providers[LIFERAY_PROVIDER_KEY]) {
    const iss_id = LIFERAY_PROVIDER_KEY;
    const iss = process.env.OAUTH2_LIFERAY_AUTH_URL;

    const Strtg = require('passport-oauth2').Strategy;

    //read user profile
    Strtg.prototype.userProfile = (access_token, done) => {
      return oauth2.user_profile(iss, access_token, done);
    };

    providers[iss_id] = {
      id: iss_id,
      name: 'Liferay',
      options: {
        scope: ['liferay-json-web-services.everything.read.userprofile']
      },
      Strategy: Strtg,
      strategy_options: {
        clientID: process.env.OAUTH2_LIFERAY_CLIENT_ID,
        clientSecret: process.env.OAUTH2_LIFERAY_SECRET,
        authorizationURL: process.env.OAUTH2_LIFERAY_AUTH_URL,
        tokenURL: process.env.OAUTH2_LIFERAY_TOKEN_URL,
        callbackURL: process.env.OAUTH2_LIFERAY_CALLBACK_URL
      },
      strategy_callback: async (req, accessToken, refreshToken, extraParams, profile, done) => {
        profile = await oauth2.ensure_username(iss, accessToken, profile);
        // console.log('strategy_callback', accessToken, refreshToken, extraParams, profile);


        // TODO probably rename /rest/<username>/* to /rest/users/<username>/* (breaking change !!!)

        if(typeof req.incoming_timestamp !== "number") {
          throw Error(`req.incoming_timestamp is not number, but ${req.incoming_timestamp}`);
        }
        if(typeof extraParams.expires_in !== "number") {
          throw Error(`extraParams.expires_in is not number, but ${extraParams.expires_in}`);
        }

        return done(null, {
          ...oauth2.user_profile_to_client_page_props(profile),
          authn: {
            iss_id: iss_id,
            iss: iss,
            sub: profile.claims.sub,
            access_token: accessToken,
            iat: req.incoming_timestamp, // it's not precise, but should be safe enough
            exp: req.incoming_timestamp + extraParams.expires_in,  // it's not precise, but should be safe enough
            refresh_token: refreshToken,
          }
        });
      },
      get_authn_headers: oauth2.get_authn_headers,
      user_profile_to_client_page_props: oauth2.user_profile_to_client_page_props,
      refresh_authn_info: async (user) => {
        return await oauth2.refresh_authn_info(
            process.env.OAUTH2_LIFERAY_TOKEN_URL,
            process.env.OAUTH2_LIFERAY_CLIENT_ID,
            process.env.OAUTH2_LIFERAY_SECRET,
            user
        );
      },
      refresh_authn_info_if_needed: async (req) => {
        return await oauth2.refresh_authn_info_if_needed(
            process.env.OAUTH2_LIFERAY_TOKEN_URL,
            process.env.OAUTH2_LIFERAY_CLIENT_ID,
            process.env.OAUTH2_LIFERAY_SECRET,
            req
        );
      },
    };

  }

  return providers;
};