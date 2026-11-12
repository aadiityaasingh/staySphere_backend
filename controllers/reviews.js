const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({
      success: false,
      message: "Listing not found!",
    });
  }

  let reviewData = req.body.review || req.body;
  if (typeof reviewData === "string") {
    try {
      reviewData = JSON.parse(reviewData);
    } catch {
      // ignore
    }
  }

  const cleanliness = Number(reviewData.cleanliness) || 5;
  const accuracy = Number(reviewData.accuracy) || 5;
  const communication = Number(reviewData.communication) || 5;
  const locationRating = Number(reviewData.locationRating) || 5;
  const value = Number(reviewData.value) || 5;
  const overall =
    Number(reviewData.rating) ||
    Math.round(
      (cleanliness + accuracy + communication + locationRating + value) / 5
    );

  const newReview = new Review({
    ...reviewData,
    cleanliness,
    accuracy,
    communication,
    locationRating,
    value,
    rating: overall,
    author: req.user._id,
  });

  await newReview.save();
  listing.reviews.push(newReview);
  await listing.save();

  const populatedReview = await Review.findById(newReview._id).populate(
    "author",
    "username email"
  );

  res.status(201).json({
    success: true,
    message: "New Review Created!",
    review: populatedReview,
  });
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({
      success: false,
      message: "Listing not found!",
    });
  }

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  const deletedReview = await Review.findByIdAndDelete(reviewId);

  if (!deletedReview) {
    return res.status(404).json({
      success: false,
      message: "Review not found!",
    });
  }

  res.status(200).json({
    success: true,
    message: "Review Deleted!",
  });
};
