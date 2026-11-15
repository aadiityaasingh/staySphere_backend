const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().min(0).required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    category: Joi.string()
      .valid(
        "trending",
        "rooms",
        "iconic-cities",
        "mountains",
        "castles",
        "amazing-pools",
        "lakefront",
        "adventure",
        "beachfront"
      )
      .default("trending")
      .allow("", null),
    image: Joi.any().allow("", null),
    images: Joi.any().allow("", null),
    propertyType: Joi.string().allow("", null),
    bedrooms: Joi.number().min(1).allow("", null),
    beds: Joi.number().min(1).allow("", null),
    bathrooms: Joi.number().min(1).allow("", null),
    amenities: Joi.any().allow("", null),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required().trim(),
    cleanliness: Joi.number().min(1).max(5).allow(null),
    accuracy: Joi.number().min(1).max(5).allow(null),
    communication: Joi.number().min(1).max(5).allow(null),
    locationRating: Joi.number().min(1).max(5).allow(null),
    value: Joi.number().min(1).max(5).allow(null),
  }).required(),
});
