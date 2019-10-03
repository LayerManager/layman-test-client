require("@babel/register")({
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        },
      },
    ]
  ]
});

require('dotenv').config();

const express = require('express');
const next = require('next');
const proxy = require('http-proxy-middleware');
const AUTHN_ROUTES = require("./src/authn/routes").default;
const user_util = require("./src/authn/user").default;
const authn_util = require("./src/authn/util").default;
const session_util = require('./src/session');


const server = express();

const dev = process.env.NODE_ENV !== 'production';
const nextjs_app = next({ dev });
const nextjs_handle = nextjs_app.getRequestHandler();

// https://auth0.com/blog/next-js-authentication-tutorial/
const passport = require("passport");

nextjs_app.prepare()
    .then(() => {

      server.get('/static/*', nextjs_handle);
      server.get('/_next/*', nextjs_handle);

      // setup express session for passport.js
      server.use(session_util.create_express_session());

      // initialize passport.js and authn routes
      authn_util.config_passport(passport);
      server.use(passport.initialize());
      server.use(passport.session());
      server.use(AUTHN_ROUTES);

      // check current user and get props for client side
      server.get('/current-user-props',
          authn_util.add_incoming_timestamp,
          authn_util.refresh_authn_info_if_needed,
          async (req, res) => {
            await user_util.current_user_props(req, res);
          }
      );

      //Layman proxy
      server.use('/rest',
          authn_util.add_incoming_timestamp,
          authn_util.refresh_authn_info_if_needed,
          proxy({
            target: process.env.LAYMAN_REST_URL,
            changeOrigin: true,
            onProxyReq: authn_util.add_authn_headers,
          }),
      );

      // handling everything else with Next.js
      server.get('*',
          authn_util.add_incoming_timestamp,
          nextjs_handle,
      );

      server.listen(3000, (err) => {
          if (err) throw err;
          console.log('> Ready on http://localhost:3000')
      });
    })
    .catch((ex) => {
        console.error(ex.stack);
        process.exit(1);
    });