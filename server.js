const express = require('express');
const next = require('next');
const proxy = require('http-proxy-middleware');
const auth_routes = require("./auth-routes");
const auth_providers = require("./auth-providers")();
const user_util = require("./src/user");

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });

const server = express();


// without next-auth
// https://auth0.com/blog/next-js-authentication-tutorial/
const session = require("express-session");
const RedisStore = require('connect-redis')(session);

// 2 - add session management to Express
console.log(`process.env.REDIS_URI ${process.env.REDIS_URI}`)
const sessionStore = new RedisStore({
  url: process.env.REDIS_URI,
  db: 1
});

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) * 1000,
  },
  resave: false,
  saveUninitialized: true,
  store: sessionStore
};

const expressSession = session(sessionConfig);

server.use(expressSession);


const handle = nextApp.getRequestHandler();

const passport = require("passport");

nextApp.prepare()
    .then(() => {
      // 4 - configuring Passport
      Object.values(auth_providers).forEach(provider => {
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

      server.get('/_next/*', (req, res) => {
          return handle(req, res)
      });
      server.get('/static/*', (req, res) => {
          return handle(req, res)
      });

      // 5 - adding Passport and authentication routes
      server.use(passport.initialize());
      server.use(passport.session());
      server.use(auth_routes);

      server.get('/current-user-props', async (req, res) => {
        await user_util.current_user_props(auth_providers, req, res);
      });

      server.use('/rest', proxy({
        target: 'http://localhost:8000',
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
          // console.log('onProxyReq', Object.keys(proxyReq), Object.keys(req));
          console.log('onProxyReq url', req.url);
          console.log('onProxyReq user', req.session.passport && req.session.passport.user);
          if(req.session.passport && req.session.passport.user) {
            const user = req.session.passport.user;
            const headers = auth_providers[user.authn.iss_id].get_authn_headers(user);
            console.log('adding headers', headers);
            Object.keys(headers).forEach(k => {
              const v = headers[k];
              proxyReq.setHeader(k, v);

            });
            // proxyReq.setHeader('x-added', 'foobar');
            console.log('onProxyReq new headers', headers);
          }

        }
      }));


      // handling everything else with Next.js
      server.get('*', (req, res) => {
          return handle(req, res)
      });

      server.listen(3000, (err) => {
          if (err) throw err;
          console.log('> Ready on http://localhost:3000')
      });
    })
    .catch((ex) => {
        console.error(ex.stack);
        process.exit(1);
    });