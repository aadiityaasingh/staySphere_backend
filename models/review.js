const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    accuracy: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    locationRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    value: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
