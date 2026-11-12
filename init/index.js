if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const { geocodeAddress } = require("../utils/geocode.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("Connected to DB for initialization");
    initDB();
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

const SUPPLEMENTAL_PHOTOS = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=70",
];

// Intelligent category classifier based on title, description, and place
function classifyListing(title = "", description = "", location = "", country = "") {
  const text = `${title} ${description} ${location} ${country}`.toLowerCase();

  if (
    text.includes("beach") ||
    text.includes("ocean") ||
    text.includes("sea") ||
    text.includes("coast") ||
    text.includes("island") ||
    text.includes("malibu") ||
    text.includes("cancun") ||
    text.includes("bali") ||
    text.includes("mykonos") ||
    text.includes("maldives")
  ) {
    return "beachfront";
  }

  if (
    text.includes("lake") ||
    text.includes("tahoe") ||
    text.includes("waterfront") ||
    text.includes("river")
  ) {
    return "lakefront";
  }

  if (
    text.includes("mountain") ||
    text.includes("ski") ||
    text.includes("chalet") ||
    text.includes("aspen") ||
    text.includes("verbier") ||
    text.includes("banff") ||
    text.includes("montana") ||
    text.includes("rockies")
  ) {
    return "mountains";
  }

  if (
    text.includes("castle") ||
    text.includes("villa") ||
    text.includes("palace") ||
    text.includes("historic") ||
    text.includes("tuscany") ||
    text.includes("florence") ||
    text.includes("cotswolds") ||
    text.includes("scotland") ||
    text.includes("charleston")
  ) {
    return "castles";
  }

  if (
    text.includes("pool") ||
    text.includes("infinity") ||
    text.includes("phuket") ||
    text.includes("dubai") ||
    text.includes("oasis") ||
    text.includes("swim")
  ) {
    return "amazing-pools";
  }

  if (
    text.includes("treehouse") ||
    text.includes("safari") ||
    text.includes("serengeti") ||
    text.includes("eco") ||
    text.includes("nature") ||
    text.includes("cabin") ||
    text.includes("adventure")
  ) {
    return "adventure";
  }

  if (
    text.includes("new york") ||
    text.includes("los angeles") ||
    text.includes("amsterdam") ||
    text.includes("boston") ||
    text.includes("tokyo") ||
    text.includes("miami") ||
    text.includes("city") ||
    text.includes("downtown") ||
    text.includes("loft") ||
    text.includes("penthouse")
  ) {
    return "iconic-cities";
  }

  if (text.includes("room") || text.includes("apartment") || text.includes("studio")) {
    return "rooms";
  }

  return "trending";
}

const initDB = async () => {
  try {
    let demoUser = await User.findOne({ username: "demohost" });
    if (!demoUser) {
      demoUser = new User({ username: "demohost", email: "demo@staysphere.com" });
      demoUser = await User.register(demoUser, "password123");
      console.log("Created demo host user:", demoUser.username);
    }

    const listingsWithMeta = await Promise.all(
      initData.data.map(async (obj, index) => {
        const geo = await geocodeAddress(obj.location, obj.country);
        const mainImage = obj.image || {
          url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=60",
          filename: "main",
        };

        const category = classifyListing(
          obj.title,
          obj.description,
          obj.location,
          obj.country
        );

        const gallery = [
          mainImage,
          {
            url: SUPPLEMENTAL_PHOTOS[(index + 1) % SUPPLEMENTAL_PHOTOS.length],
            filename: "photo2",
          },
          {
            url: SUPPLEMENTAL_PHOTOS[(index + 2) % SUPPLEMENTAL_PHOTOS.length],
            filename: "photo3",
          },
          {
            url: SUPPLEMENTAL_PHOTOS[(index + 3) % SUPPLEMENTAL_PHOTOS.length],
            filename: "photo4",
          },
          {
            url: SUPPLEMENTAL_PHOTOS[(index + 4) % SUPPLEMENTAL_PHOTOS.length],
            filename: "photo5",
          },
        ];

        return {
          ...obj,
          owner: demoUser._id,
          category,
          geometry: geo,
          images: gallery,
          image: mainImage,
        };
      })
    );

    await Listing.deleteMany({});
    await Listing.insertMany(listingsWithMeta);
    console.log(`Successfully classified and seeded ${listingsWithMeta.length} listings!`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed database:", err);
    process.exit(1);
  }
};
