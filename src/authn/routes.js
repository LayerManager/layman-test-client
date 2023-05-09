import express from "express";
import passport from "passport";
import authn_providers_m from "./providers";
const PROVIDERS = authn_providers_m();
import user_util from './user';


const BASEPATH = process.env.LTC_BASEPATH;
const router = express.Router();


Object.values(PROVIDERS).forEach(provider => {
  router.get(
      `${BASEPATH}/authn/${provider.id}/login`,
      passport.authenticate(
          provider.id,
          provider.options
      ),
      (req, res) => res.redirect(`${BASEPATH}/`)
  );


  router.get(`${BASEPATH}/authn/${provider.id}/callback`, (req, res, next) => {
    passport.authenticate(
        provider.id,
        (err, user) => {
          if (err) return next(err);
          if (!user) return res.redirect(`/`);
          req.logIn(user, (err) => {
            if (err) return next(err);
            res.redirect(`${BASEPATH}/`);
          });
        }
    )(req, res, next);
  });


  router.get(`${BASEPATH}/authn/logout`, async (req, res) => {
    console.log('/authn/logout');
    await user_util.delete_current_user(req);
    req.logout((err) => {
      if(err) {
        console.error(err);
      }
      res.redirect(`${BASEPATH}/`);
      // possibly also logout from authentication provider (e.g. Wagtail)
    });
  });

});



export default router;
