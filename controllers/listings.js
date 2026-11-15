const Listing = require("../models/listing.js");
const { geocodeAddress } = require("../utils/geocode.js");

module.exports.index = async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    propertyType,
    bedrooms,
    beds,
    bathrooms,
    amenities,
  } = req.query;
  let conditions = [];

  if (category && category !== "all" && category !== "trending") {
    const cat = category.toLowerCase();
    const categoryKeywords = {
      beachfront: [
        "beach",
        "ocean",
        "sea",
        "coast",
        "surf",
        "bungalow",
        "island",
        "malibu",
        "cancun",
        "bali",
        "mykonos",
        "maldives",
        "costa rica",
      ],
      mountains: [
        "mountain",
        "cabin",
        "chalet",
        "ski",
        "aspen",
        "verbier",
        "banff",
        "montana",
        "alps",
      ],
      lakefront: [
        "lake",
        "lakefront",
        "tahoe",
        "waterfront",
        "new hampshire",
        "river",
      ],
      castles: [
        "castle",
        "villa",
        "palace",
        "historic",
        "tuscany",
        "florence",
        "cotswolds",
        "scotland",
        "charleston",
      ],
      "amazing-pools": [
        "pool",
        "villa",
        "phuket",
        "dubai",
        "resort",
        "oasis",
        "luxury",
        "infinity",
      ],
      "iconic-cities": [
        "city",
        "new york",
        "los angeles",
        "amsterdam",
        "boston",
        "tokyo",
        "miami",
        "downtown",
        "loft",
        "penthouse",
        "apartment",
      ],
      adventure: [
        "treehouse",
        "safari",
        "serengeti",
        "eco",
        "costa rica",
        "portland",
        "nature",
        "wild",
      ],
      rooms: ["room", "loft", "apartment", "studio", "canal", "brownstone"],
    };

    const keywords = categoryKeywords[cat] || [];
    const regexTerms = keywords.map((k) => new RegExp(k, "i"));

    conditions.push({
      $or: [
        { category: cat },
        { title: { $in: regexTerms } },
        { location: { $in: regexTerms } },
        { country: { $in: regexTerms } },
        { description: { $in: regexTerms } },
      ],
    });
  }

  if (search && search.trim() !== "") {
    const term = search.trim();
    conditions.push({
      $or: [
        { title: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
        { country: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ],
    });
  }

  // Property Type Filter
  if (propertyType && propertyType !== "any") {
    conditions.push({ propertyType });
  }

  // Minimum Bedrooms, Beds, Bathrooms
  if (bedrooms && !isNaN(Number(bedrooms)) && Number(bedrooms) > 0) {
    conditions.push({ bedrooms: { $gte: Number(bedrooms) } });
  }
  if (beds && !isNaN(Number(beds)) && Number(beds) > 0) {
    conditions.push({ beds: { $gte: Number(beds) } });
  }
  if (bathrooms && !isNaN(Number(bathrooms)) && Number(bathrooms) > 0) {
    conditions.push({ bathrooms: { $gte: Number(bathrooms) } });
  }

  // Amenities Filter (match all selected amenities)
  if (amenities) {
    const list = Array.isArray(amenities)
      ? amenities
      : String(amenities)
          .split(",")
          .map((a) => a.trim().toLowerCase())
          .filter(Boolean);
    if (list.length > 0) {
      conditions.push({ amenities: { $all: list } });
    }
  }

  let query = {};
  if (conditions.length === 1) {
    query = conditions[0];
  } else if (conditions.length > 1) {
    query = { $and: conditions };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice && !isNaN(Number(minPrice))) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      query.price.$lte = Number(maxPrice);
    }
  }

  const listings = await Listing.find(query)
    .populate("owner", "username email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: listings.length,
    listings,
  });
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
        select: "username email",
      },
    })
    .populate("owner", "username email");

  if (!listing) {
    return res.status(404).json({
      success: false,
      message: "Listing not found!",
    });
  }

  res.status(200).json({
    success: true,
    listing,
  });
};

module.exports.createListing = async (req, res) => {
  let listingData = req.body.listing || req.body;
  if (typeof listingData === "string") {
    try {
      listingData = JSON.parse(listingData);
    } catch {
      // ignore
    }
  }

  const newListing = new Listing(listingData);
  newListing.owner = req.user._id;

  // Process Geocoding
  const geo = await geocodeAddress(newListing.location, newListing.country);
  newListing.geometry = geo;

  // Process multiple images from multer
  let uploadedFiles = [];
  if (req.files) {
    if (req.files.images) uploadedFiles.push(...req.files.images);
    if (req.files.image) uploadedFiles.push(...req.files.image);
  } else if (req.file) {
    uploadedFiles.push(req.file);
  }

  if (uploadedFiles.length > 0) {
    const formattedImages = uploadedFiles.map((file) => ({
      url: file.path,
      filename: file.filename,
    }));
    newListing.images = formattedImages;
    newListing.image = formattedImages[0]; // backward compatibility
  }

  await newListing.save();
  const populated = await Listing.findById(newListing._id).populate(
    "owner",
    "username email"
  );

  res.status(201).json({
    success: true,
    message: "New Listing Created!",
    listing: populated,
  });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let updateData = req.body.listing || req.body;
  if (typeof updateData === "string") {
    try {
      updateData = JSON.parse(updateData);
    } catch {
      // ignore
    }
  }

  let listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).json({
      success: false,
      message: "Listing not found!",
    });
  }

  Object.assign(listing, updateData);

  // Re-geocode if location or country changed
  if (updateData.location || updateData.country) {
    const geo = await geocodeAddress(listing.location, listing.country);
    listing.geometry = geo;
  }

  // Process uploaded images
  let uploadedFiles = [];
  if (req.files) {
    if (req.files.images) uploadedFiles.push(...req.files.images);
    if (req.files.image) uploadedFiles.push(...req.files.image);
  } else if (req.file) {
    uploadedFiles.push(req.file);
  }

  if (uploadedFiles.length > 0) {
    const newImages = uploadedFiles.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    listing.images = [...(listing.images || []), ...newImages];
    listing.image = listing.images[0];
  }

  await listing.save();

  const updatedListing = await Listing.findById(id)
    .populate("owner", "username email")
    .populate({
      path: "reviews",
      populate: { path: "author", select: "username email" },
    });

  res.status(200).json({
    success: true,
    message: "Listing Updated Successfully!",
    listing: updatedListing,
  });
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  if (!deletedListing) {
    return res.status(404).json({
      success: false,
      message: "Listing not found!",
    });
  }

  res.status(200).json({
    success: true,
    message: "Listing Deleted!",
  });
};
