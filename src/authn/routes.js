import express from "express";
import passport from "passport";
import authn_providers_m from "./providers";
const PROVIDERS = authn_providers_m();


const router = express.Router();


Object.values(PROVIDERS).forEach(provider => {
  router.get(
      `/authn/${provider.id}/login`,
      passport.authenticate(
          provider.id,
          provider.options
      ),
      (req, res) => res.redirect("/")
  );


  router.get(`/authn/${provider.id}/callback`, (req, res, next) => {
    passport.authenticate(
        provider.id,
        (err, user) => {
          if (err) return next(err);
          if (!user) return res.redirect(`/`);
          req.logIn(user, (err) => {
            if (err) return next(err);
            res.redirect("/");
          });
        }
    )(req, res, next);
  });


  router.get("/authn/logout", (req, res) => {
    console.log('/authn/logout');
    req.logout();
    res.redirect("/");
    // possibly also logout from authentication provider (e. g. Liferay)
  });

});



export default router;
