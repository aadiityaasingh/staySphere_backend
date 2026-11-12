const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

router.post("/", isLoggedIn, wrapAsync(bookingController.createBooking));
router.get("/my", isLoggedIn, wrapAsync(bookingController.getMyBookings));
router.get(
  "/listing/:id/reserved-dates",
  wrapAsync(bookingController.getReservedDates)
);
router.post(
  "/:id/cancel",
  isLoggedIn,
  wrapAsync(bookingController.cancelBooking)
);
router.post(
  "/:id/verify-payment",
  isLoggedIn,
  wrapAsync(bookingController.verifyPayment)
);

module.exports = router;
