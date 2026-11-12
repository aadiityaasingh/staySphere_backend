const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

describe("Listings REST API", () => {
  let sampleListingId;

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("GET /api/v1/listings should return 200 with list of properties", async () => {
    const res = await request(app).get("/api/v1/listings");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.listings)).toBe(true);
    expect(res.body.listings.length).toBeGreaterThan(0);

    // Save one sample listing ID for subsequent single-item test
    sampleListingId = res.body.listings[0]._id;
  });

  it("GET /api/v1/listings?category=beachfront should return filtered results", async () => {
    const res = await request(app).get("/api/v1/listings?category=beachfront");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.listings)).toBe(true);
  });

  it("GET /api/v1/listings?search=Goa should return matching search results", async () => {
    const res = await request(app).get("/api/v1/listings?search=Goa");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.listings)).toBe(true);
  });

  it("GET /api/v1/listings/:id should return single listing details", async () => {
    if (!sampleListingId) return;
    const res = await request(app).get(`/api/v1/listings/${sampleListingId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.listing).toHaveProperty("_id", sampleListingId);
    expect(res.body.listing).toHaveProperty("title");
    expect(res.body.listing).toHaveProperty("price");
  });

  it("GET /api/v1/listings/:id with nonexistent ID should return 404", async () => {
    const nonExistentId = "000000000000000000000000";
    const res = await request(app).get(`/api/v1/listings/${nonExistentId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "Listing not found!");
  });
});
