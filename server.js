// Simple Express backend that proxies Google Places API (New)
// to expose fields like `reservable` to your frontend without
// exposing the server API key in the browser.

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// IMPORTANT: set this environment variable in your hosting platform
// (Render, Railway, Vercel, etc.)
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  console.warn("WARNING: GOOGLE_PLACES_API_KEY is not set. The API will not work until you configure it.");
}

// Basic health check
app.get("/", (req, res) => {
  res.send("Restaurant map backend is running.");
});

// GET /api/place-details?place_id=ChIJ...
app.get("/api/place-details", async (req, res) => {
  const placeId = req.query.place_id;
  if (!placeId) {
    return res.status(400).json({ error: "place_id is required" });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: "Server is missing GOOGLE_PLACES_API_KEY" });
  }

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      fields: [
        "displayName",
        "formattedAddress",
        "rating",
        "userRatingCount",
        "priceLevel",
        "reservable",
        "currentOpeningHours",
        "websiteUri"
      ].join(","),
      languageCode: "sv",
      regionCode: "SE"
    });

    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error("Places API error:", response.status, text);
      return res.status(response.status).send(text);
    }

    const data = await response.json();

    // Map only the fields we need to a simpler structure
    res.json({
      id: data.name || null, // e.g. "places/ChIJ..."
      displayName: data.displayName && data.displayName.text ? data.displayName.text : null,
      formattedAddress: data.formattedAddress || null,
      rating: data.rating ?? null,
      userRatingsTotal: data.userRatingCount ?? null,
      priceLevel: data.priceLevel ?? null,
      reservable: data.reservable ?? null,
      currentOpeningHours: data.currentOpeningHours || null,
      websiteUri: data.websiteUri || null
    });
  } catch (err) {
    console.error("Backend error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Restaurant map backend listening on port ${port}`);
});
