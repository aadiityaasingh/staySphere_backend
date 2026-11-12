const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require("stripe")(stripeKey) : null;

module.exports.createBooking = async (req, res) => {
  try {
    const { listingId, checkIn, checkOut, guestsCount = 1 } = req.body;

    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Listing, check-in, and check-out dates are required.",
      });
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid dates provided.",
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date.",
      });
    }

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past.",
      });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
      });
    }

    // Check for collision with existing confirmed bookings
    const conflictingBooking = await Booking.findOne({
      listing: listingId,
      status: "confirmed",
      $or: [
        {
          checkIn: { $lt: endDate },
          checkOut: { $gt: startDate },
        },
      ],
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message:
          "Selected dates are no longer available. Please select different dates.",
      });
    }


    const diffTime = Math.abs(endDate - startDate);
    const totalNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const nightlyPrice = listing.price || 0;
    const subtotal = totalNights * nightlyPrice;
    const cleaningFee = 500;
    const serviceFee = Math.round(subtotal * 0.05); // 5% fee
    const taxes = Math.round((subtotal + cleaningFee + serviceFee) * 0.18); // 18% GST
    const totalPrice = subtotal + cleaningFee + serviceFee + taxes;

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    if (stripe) {
      const newBooking = new Booking({
        listing: listingId,
        guest: req.user._id,
        checkIn: startDate,
        checkOut: endDate,
        guestsCount: Number(guestsCount) || 1,
        totalNights,
        nightlyPrice,
        subtotal,
        cleaningFee,
        serviceFee,
        taxes,
        totalPrice,
        status: "pending",
        paymentStatus: "unpaid",
      });

      await newBooking.save();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: `${listing.title} (${totalNights} night${totalNights > 1 ? "s" : ""})`,
                description: `${listing.location}, ${listing.country} · Check-in: ${startDate.toLocaleDateString()}`,
                images: listing.images?.[0]?.url
                  ? [listing.images[0].url]
                  : [listing.image?.url],
              },
              unit_amount: Math.round(totalPrice * 100), // in paise
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${frontendUrl}/bookings/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${newBooking._id}`,
        cancel_url: `${frontendUrl}/listings/${listingId}?booking_cancelled=true`,
        customer_email: req.user.email,
        metadata: {
          bookingId: newBooking._id.toString(),
          listingId: listingId.toString(),
          guestId: req.user._id.toString(),
        },
      });

      newBooking.stripeSessionId = session.id;
      await newBooking.save();

      return res.status(200).json({
        success: true,
        booking: newBooking,
        checkoutUrl: session.url,
      });
    }

    const instantBooking = new Booking({
      listing: listingId,
      guest: req.user._id,
      checkIn: startDate,
      checkOut: endDate,
      guestsCount: Number(guestsCount) || 1,
      totalNights,
      nightlyPrice,
      subtotal,
      cleaningFee,
      serviceFee,
      taxes,
      totalPrice,
      status: "confirmed",
      paymentStatus: "paid",
    });

    await instantBooking.save();
    const populated = await Booking.findById(instantBooking._id)
      .populate("listing")
      .populate("guest", "username email");

    return res.status(201).json({
      success: true,
      message: "Reservation confirmed successfully!",
      booking: populated,
      isSimulated: true,
    });
  } catch (err) {
    console.error("Booking creation error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create reservation.",
    });
  }
};

module.exports.getReservedDates = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.find({
      listing: id,
      status: "confirmed",
      checkOut: { $gte: new Date() },
    }).select("checkIn checkOut -_id");

    res.status(200).json({
      success: true,
      reservedDates: bookings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reserved dates",
    });
  }
};

module.exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id })
      .populate({
        path: "listing",
        populate: { path: "owner", select: "username email" },
      })
      .sort({ checkIn: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your bookings",
    });
  }
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!booking.guest.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to cancel this booking.",
      });
    }

    booking.status = "cancelled";
    booking.paymentStatus = "refunded";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully.",
      booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel reservation",
    });
  }
};

module.exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    const booking = await Booking.findById(id).populate("listing");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (stripe && sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        booking.status = "confirmed";
        booking.paymentStatus = "paid";
        booking.stripePaymentIntentId = session.payment_intent;
        await booking.save();
      }
    } else {
      booking.status = "confirmed";
      booking.paymentStatus = "paid";
      await booking.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed!",
      booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to verify payment",
    });
  }
};
