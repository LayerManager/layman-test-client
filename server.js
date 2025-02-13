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
const {createProxyMiddleware} = require('http-proxy-middleware');
const AUTHN_ROUTES = require("./src/authn/routes").default;
const user_util = require("./src/authn/user").default;
const authn_util = require("./src/authn/util").default;
const session_util = require('./src/session');


const server = express();

const dev = process.env.NODE_ENV !== 'production';
const nextjs_app = next({ dev });
const nextjs_handle_original = nextjs_app.getRequestHandler();
const nextjs_handle = (req, res) => {
  // not sure, why is this redefinition of nextjs_handle needed
  nextjs_handle_original(req, res)
}

// https://auth0.com/blog/next-js-authentication-tutorial/
const passport = require("passport");

const BASEPATH = process.env.LTC_BASEPATH;

const add_layman_proxy_headers = (proxyReq, req, res) => {
  authn_util.add_authn_headers(proxyReq, req, res);
  const protoFromEnv = process.env.OAUTH2_CALLBACK_URL ? new URL(process.env.OAUTH2_CALLBACK_URL).protocol.slice(0, -1) : null;
  proxyReq.setHeader('X-Forwarded-Proto', protoFromEnv || req.protocol);
  proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
  proxyReq.setHeader('X-Forwarded-Prefix', BASEPATH);
}

nextjs_app.prepare()
    .then(async () => {

      if(BASEPATH) {
        server.get('/', (req, res) => res.redirect(`${BASEPATH}/`));
      }

      server.use(`${BASEPATH}/static`,
          (req, res, next) => {
            req.url = '/static'+req.url;
            next();
          },
          nextjs_handle,
      );
      server.use(`${BASEPATH}/_next`,
          (req, res, next) => {
            req.url = '/_next'+req.url;
            next();
          },
          nextjs_handle,
      );

      // setup express session for passport.js
      const express_session = await session_util.create_express_session();
      server.use(express_session);

      // initialize passport.js and authn routes
      authn_util.config_passport(passport);
      server.use(passport.initialize());
      server.use(passport.session());
      server.use(
          authn_util.add_incoming_timestamp,
          AUTHN_ROUTES,
      );

      // check current user and get props for client side
      server.get(`${BASEPATH}/current-user-props`,
          authn_util.add_incoming_timestamp,
          authn_util.refresh_authn_info_if_needed,
          async (req, res) => {
            await user_util.current_user_props(req, res);
          }
      );

      //Layman proxy for rest API
      server.use(`${BASEPATH}/rest`,
          authn_util.add_incoming_timestamp,
          authn_util.refresh_authn_info_if_needed,
          createProxyMiddleware({
            target: process.env.LTC_LAYMAN_REST_URL,
            changeOrigin: true,
            onProxyReq: add_layman_proxy_headers,
            pathRewrite: {
              [`^${BASEPATH}/rest`]: '/rest',
            }
          }),
      );

      //Layman proxy for WFS proxy
      server.use(`${BASEPATH}/geoserver`,
          authn_util.add_incoming_timestamp,
          authn_util.refresh_authn_info_if_needed,
          createProxyMiddleware({
            target: process.env.LTC_LAYMAN_REST_URL,
            changeOrigin: true,
            onProxyReq: add_layman_proxy_headers,
            pathRewrite: {
              [`^${BASEPATH}/geoserver`]: '/geoserver',
            }
          }),
      );

      // handling everything else with Next.js
      server.use(
          `${BASEPATH}`,
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