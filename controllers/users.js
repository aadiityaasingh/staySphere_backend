const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      return res.status(201).json({
        success: true,
        message: "Registered and logged in successfully!",
        user: {
          _id: registeredUser._id,
          username: registeredUser.username,
          email: registeredUser.email,
          wishlist: registeredUser.wishlist || [],
        },
      });
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to register.",
    });
  }
};

module.exports.login = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    message: "Logged in successfully!",
    user: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      wishlist: user?.wishlist || [],
    },
  });
};

module.exports.logOut = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      return res.status(200).json({
        success: true,
        message: "Logged out successfully!",
      });
    });
  });
};

module.exports.getCurrentUser = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(200).json({
      success: true,
      user: null,
    });
  }

  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      wishlist: user?.wishlist || [],
    },
  });
};

module.exports.toggleWishlist = async (req, res) => {
  try {
    const { listingId } = req.params;
    const user = await User.findById(req.user._id);

    const stringWishlist = (user.wishlist || []).map((id) => id.toString());
    const index = stringWishlist.indexOf(listingId.toString());
    let isSaved = false;

    if (index > -1) {
      user.wishlist.splice(index, 1);
      isSaved = false;
    } else {
      user.wishlist.push(listingId);
      isSaved = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      isSaved,
      wishlist: user.wishlist,
      message: isSaved ? "Saved to your wishlist!" : "Removed from wishlist",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update wishlist",
    });
  }
};

module.exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "wishlist",
      populate: { path: "owner", select: "username email" },
    });

    res.status(200).json({
      success: true,
      wishlist: user?.wishlist || [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
    });
  }
};

module.exports.getHostDashboard = async (req, res) => {
  try {
    const hostId = req.user._id;

    // 1. All listings hosted by current user
    const listings = await Listing.find({ owner: hostId }).populate("reviews");

    // 2. All bookings placed for host's properties
    const listingIds = listings.map((l) => l._id);
    const bookings = await Booking.find({
      listing: { $in: listingIds },
    })
      .populate("listing", "title location country image images price")
      .populate("guest", "username email")
      .sort({ createdAt: -1 });

    // 3. Stats calculations
    const totalListings = listings.length;
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    const totalRevenue = confirmedBookings.reduce(
      (acc, b) => acc + (b.totalPrice || 0),
      0
    );

    let allReviews = [];
    listings.forEach((l) => {
      if (l.reviews && l.reviews.length > 0) {
        allReviews.push(...l.reviews);
      }
    });

    const avgRating =
      allReviews.length > 0
        ? (
            allReviews.reduce((sum, r) => sum + (r.rating || 5), 0) /
            allReviews.length
          ).toFixed(1)
        : "5.0";

    res.status(200).json({
      success: true,
      stats: {
        totalListings,
        totalBookings: confirmedBookings.length,
        totalRevenue,
        avgRating,
        totalReviews: allReviews.length,
      },
      listings,
      bookings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load host dashboard",
    });
  }
};
