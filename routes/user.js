const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { isLoggedIn } = require("../middleware.js");
const userController = require("../controllers/users.js");

router.post("/signup", wrapAsync(userController.signup));

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info ? info.message : "Invalid username or password",
      });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      return userController.login(req, res);
    });
  })(req, res, next);
});

router.post("/logout", userController.logOut);
router.get("/logout", userController.logOut);
router.get("/me", wrapAsync(userController.getCurrentUser));

// Wishlist
router.post(
  "/wishlist/:listingId",
  isLoggedIn,
  wrapAsync(userController.toggleWishlist)
);
router.get("/wishlist", isLoggedIn, wrapAsync(userController.getWishlist));

// Host Dashboard
router.get(
  "/dashboard",
  isLoggedIn,
  wrapAsync(userController.getHostDashboard)
);
router.get(
  "/host/dashboard",
  isLoggedIn,
  wrapAsync(userController.getHostDashboard)
);

module.exports = router;
