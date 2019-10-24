import dotenv from 'dotenv';
dotenv.config();

import session from "express-session";
import connect_redis from 'connect-redis';

export const create_express_session = () => {
  const Redis_Store = connect_redis(session);
  const session_store = new Redis_Store({
    url: process.env.REDIS_URI,
    db: 1
  });
  session_store.on('disconnect', () => {
    throw new Error(`Redis instance ${process.env.REDIS_URI} was disconnected!`);
  });

  const session_config = {
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) * 1000,
    },
    resave: false,
    saveUninitialized: true,
    store: session_store
  };

  return session(session_config);

};