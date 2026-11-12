const CITY_COORDINATES = {
  malibu: [-118.7798, 34.0259],
  "new york city": [-74.006, 40.7128],
  "new york": [-74.006, 40.7128],
  aspen: [-106.8175, 39.1911],
  florence: [11.2558, 43.7696],
  paris: [2.3522, 48.8566],
  london: [-0.1278, 51.5074],
  tokyo: [139.6917, 35.6895],
  bali: [115.1889, -8.4095],
  goa: [74.124, 15.2993],
  mumbai: [72.8777, 19.076],
  delhi: [77.1025, 28.7041],
  jaipur: [75.7873, 26.9124],
  bangalore: [77.5946, 12.9716],
  sydney: [151.2093, -33.8688],
  rome: [12.4964, 41.9028],
  santorini: [25.4615, 36.3932],
  dubai: [55.2708, 25.2048],
  swiss: [8.2275, 46.8182],
  switzerland: [8.2275, 46.8182],
  amsterdam: [4.9041, 52.3676],
  barcelona: [2.1734, 41.3851],
  cancun: [-86.8515, 21.1619],
  phuket: [98.3923, 7.8804],
  kyoto: [135.7681, 35.0116],
  banff: [-115.5708, 51.1784],
  maui: [-156.3319, 20.7984],
  hawaii: [-155.5828, 19.8968],
};

/**
 * Geocodes an address string (location + country) into [longitude, latitude].
 * Uses local fast cache first, then falls back to OpenStreetMap Nominatim.
 */
async function geocodeAddress(location, country) {
  const query = `${location || ""}, ${country || ""}`.toLowerCase().trim();

  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (query.includes(key)) {
      return {
        type: "Point",
        coordinates: coords,
      };
    }
  }

  try {
    const encoded = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "StaySphere-AirbnbClone/2.0 (contact: support@staysphere.com)",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            type: "Point",
            coordinates: [lon, lat], 
          };
        }
      }
    }
  } catch (err) {
    console.warn("Geocoding lookup failed:", err.message);
  }

  const defaultLng = 77.209 + (Math.random() - 0.5) * 2;
  const defaultLat = 28.6139 + (Math.random() - 0.5) * 2;
  return {
    type: "Point",
    coordinates: [defaultLng, defaultLat],
  };
}

module.exports = { geocodeAddress, CITY_COORDINATES };
