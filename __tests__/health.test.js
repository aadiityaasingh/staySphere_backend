const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

describe("Health & System API", () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("GET /api/health should return status 200 and health payload", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("environment");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET undefined route should return status 404 with standard JSON error", async () => {
    const res = await request(app).get("/api/v1/nonexistent-route-404");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "API Route Not Found");
  });
});
