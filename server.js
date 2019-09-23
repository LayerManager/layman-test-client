const express = require('express');
const next = require('next');
const proxy = require('http-proxy-middleware');
const auth_routes = require("./auth-routes");
const auth_providers = require("./auth-providers")();
const user_util = require("./src/user");

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });

const server = express();
server.use('/rest', proxy({
  target: 'http://localhost:8000', changeOrigin: true
}));


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

      // 5 - adding Passport and authentication routes
      server.use(passport.initialize());
      server.use(passport.session());
      server.use(auth_routes);

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