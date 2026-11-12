const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const { listingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: "You must be logged in first!",
    });
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  try {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found!",
      });
    }
    if (!req.user || !listing.owner.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to do that!",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    let { reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found!",
      });
    }
    if (!req.user || !review.author.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to do that!",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports.validateListing = (req, res, next) => {
  let payload = req.body;
  if (!payload.listing) {
    payload = { listing: payload };
  }

  let { error } = listingSchema.validate(payload);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(", ");
    return res.status(400).json({ success: false, message: errMsg });
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  let payload = req.body;
  if (!payload.review) {
    payload = { review: payload };
  }

  let { error } = reviewSchema.validate(payload);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(", ");
    return res.status(400).json({ success: false, message: errMsg });
  }
  next();
};
