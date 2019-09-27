import express from "express";
import passport from "passport";
import auth_providers_m from "./auth-providers";
const auth_providers = auth_providers_m();

const router = express.Router();

Object.values(auth_providers).forEach(provider => {
  router.get(
      `/auth/${provider.id}/login`,
      passport.authenticate(
          provider.id,
          provider.options
      ),
      (req, res) => res.redirect("/")
  );


  router.get(`/auth/${provider.id}/callback`, (req, res, next) => {
    passport.authenticate(
        provider.id,
        (err, user) => {
          if (err) return next(err);
          if (!user) return res.redirect(`/auth/${provider.id}/login`);
          req.logIn(user, (err) => {
            if (err) return next(err);
            res.redirect("/");
          });
        }
    )(req, res, next);
  });


  router.get("/auth/logout", (req, res) => {
    console.log('/auth/logout');
    req.logout();
    res.redirect("/");
    // possibly also logout from authentication provider (e. g. Liferay)
  });

});



export default router;
