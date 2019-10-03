import user_util from './user';
import providers_m from "./providers";
const PROVIDERS = providers_m();


const refresh_authn_info_if_needed = async (req, res, next) => {
  // console.log('util.js refresh_authn_info_if_needed')
  if (req.session.passport && req.session.passport.user) {
    const user = req.session.passport.user;
    const provider = PROVIDERS[user.authn.iss_id];
    await provider.refresh_authn_info_if_needed(req);
  }
  if(next) {
    next();
  }
};


const add_incoming_timestamp = (req, res, next) => {
  const d = new Date();
  const seconds = Math.round(d.getTime() / 1000);
  req.incoming_timestamp = seconds;
  next();
};

const add_authn_headers = (proxyReq, req, res) => {
  // console.log('onProxyReq', Object.keys(proxyReq), Object.keys(req));
  if (req.session.passport && req.session.passport.user) {
    const user = req.session.passport.user;
    const headers = PROVIDERS[user.authn.iss_id].get_authn_headers(user);
    Object.keys(headers).forEach(k => {
      const v = headers[k];
      proxyReq.setHeader(k, v);
    });
  }
};

const config_passport = (passport) => {
  Object.values(PROVIDERS).forEach(provider => {
    passport.use(
        provider.id,
        new provider.Strategy(
            {
                ...provider.strategy_options,
              passReqToCallback: true
            },
            provider.strategy_callback
        )
    );
  });
  passport.serializeUser(user_util.serialize_user);
  passport.deserializeUser(user_util.deserialize_user);
};

export default {
  refresh_authn_info_if_needed,
  add_incoming_timestamp,
  add_authn_headers,
  config_passport,
};