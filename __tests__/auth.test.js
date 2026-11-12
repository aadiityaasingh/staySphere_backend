const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/user");

describe("Authentication & Session API", () => {
  const timestamp = Date.now();
  const testUser = {
    username: `testuser_${timestamp}`,
    email: `testuser_${timestamp}@staysphere.example.com`,
    password: "Password123!Secure",
  };

  let sessionCookie;

  afterAll(async () => {
    try {
      await User.deleteOne({ username: testUser.username });
    } catch (e) {
    }
    await mongoose.connection.close();
  });

  it("POST /api/v1/users/signup should register a new user and return session cookie", async () => {
    const res = await request(app)
      .post("/api/v1/users/signup")
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user.email).toBe(testUser.email);

    // Capture connect.sid cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    sessionCookie = cookies;
  });

  it("GET /api/v1/users/me with session cookie should return authenticated user profile", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Cookie", sessionCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.user).not.toBeNull();
    expect(res.body.user.username).toBe(testUser.username);
  });

  it("POST /api/v1/users/logout should destroy session and clear cookie", async () => {
    const res = await request(app)
      .post("/api/v1/users/logout")
      .set("Cookie", sessionCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  it("POST /api/v1/users/login should re-authenticate with valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({
        username: testUser.username,
        password: testUser.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.user.username).toBe(testUser.username);
  });
});
