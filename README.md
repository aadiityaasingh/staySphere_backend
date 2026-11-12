# 🏠 StaySphere Backend API

Production RESTful JSON API for the StaySphere rental marketplace. Built with **Node.js**, **Express 5**, **MongoDB Atlas**, **Mongoose**, **Passport.js**, **Stripe**, and **Cloudinary**.

> 🚀 **Live Demo:** [stayspherefrontend.vercel.app](https://stayspherefrontend.vercel.app/)  
> 🌐 **Frontend Client Repository:** [staySphere_frontend](https://github.com/aadiityaasingh/staySphere_frontend)

---

## 🛠 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Database**: MongoDB Atlas with 2dsphere Geospatial Indexing
- **Authentication**: Passport.js Local Strategy + express-session + connect-mongo
- **Media Uploads**: Multer + Cloudinary Storage
- **Payments**: Stripe Checkout (with automated simulation fallback)
- **Security**: Helmet, Express Rate Limit, Express Mongo Sanitize, CORS with credentials
- **Testing**: Jest + Supertest

---

## 📁 API Endpoints

| Resource | Method | Path | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/health` | Service uptime and health status |
| **Auth** | `POST` | `/api/v1/users/signup` | Register new user |
| | `POST` | `/api/v1/users/login` | Log in user |
| | `POST` | `/api/v1/users/logout` | Destroy session & logout |
| | `GET` | `/api/v1/users/me` | Get current authenticated user |
| | `GET` | `/api/v1/users/wishlist` | Get user saved wishlist |
| | `POST` | `/api/v1/users/wishlist/:id` | Toggle wishlist property |
| | `GET` | `/api/v1/users/dashboard` | Host analytics & reservations |
| **Listings** | `GET` | `/api/v1/listings` | Get listings (supports `category`, `search`, `minPrice`, `maxPrice`) |
| | `GET` | `/api/v1/listings/:id` | Get single listing with reviews |
| | `POST` | `/api/v1/listings` | Create listing (with multi-image upload) |
| | `PUT` | `/api/v1/listings/:id` | Update listing |
| | `DELETE` | `/api/v1/listings/:id` | Delete listing |
| **Bookings** | `POST` | `/api/v1/bookings` | Create reservation / Stripe checkout |
| | `GET` | `/api/v1/bookings/my-trips` | Get current user's reservations |
| | `PATCH` | `/api/v1/bookings/:id/status`| Update reservation status |
| **Reviews** | `POST` | `/api/v1/listings/:id/reviews` | Post review with sub-ratings |
| | `DELETE` | `/api/v1/listings/:id/reviews/:reviewId` | Delete review |

---

## ⚙️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env and enter ATLASDB_URL, SECRET, CLOUD_NAME, etc.

# 3. Run automated tests
npm test

# 4. Start development server
npm run dev
# Server running at http://localhost:8080
```

---

## 🐳 Docker

```bash
docker build -t staysphere-api .
docker run -p 8080:8080 --env-file .env staysphere-api
```
