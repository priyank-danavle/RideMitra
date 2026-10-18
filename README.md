# RideMitra 🚗 🏍️

> **Smart, Community-Driven Carpooling & Bikepooling Platform for City & Intercity Travel**

[![CI Pipeline](https://github.com/priyank-danavle/RideMitra/actions/workflows/ci.yml/badge.svg)](https://github.com/priyank-danavle/RideMitra/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Project Purpose & Problem Statement

Daily commuters across urban hubs and regional corridors face rising fuel expenses, prolonged traffic congestion, and fragmented informal ride coordination. **RideMitra** provides a structured, responsive, and secure web platform connecting vehicle owners who have vacant seats with verified passengers travelling along the same route.

The platform uniquely supports two complementary mobility models:

1. **City Commuting:** Daily office, IT park, and university commutes via **Carpooling** and agile **Bikepooling** (two-wheeler micro-commutes).
2. **Intercity Travel:** Scheduled highway rides across high-traffic regional corridors (e.g., Surat ⇄ Ahmedabad, Vadodara ⇄ Ahmedabad, Surat ⇄ Mumbai).

RideMitra operates strictly as a **non-commercial cost-sharing platform**; drivers split actual fuel and toll costs with passengers rather than operating as commercial taxis.

---

## 2. Current Project Phase: Phase 3 — Ride Management, Search & Professional UI Revamp

The project follows a disciplined [8-Phase Engineering Roadmap](docs/roadmap.md). We have completed **Phase 1**, **Phase 2**, and **Phase 3**.

### Implemented in Phase 3:

- [x] **Relational Schema & Migrations (`database/migrations`):**
  - `004_create_rides_table.sql`: Rides table with driver and vehicle foreign keys, route definitions (`origin`, `destination`, `pickup_point`, `dropoff_point`), departure time, seat allocation, pricing in INR, lifecycle status (`SCHEDULED`, `ACTIVE`, `COMPLETED`, `CANCELLED`), and composite performance indexes (`idx_rides_discovery`, `idx_rides_route`, `idx_rides_driver`, `idx_rides_vehicle`).
- [x] **Ride Management REST API Subsystem (`apps/api`):**
  - `POST /api/v1/rides`: Publish carpool/bikepool journeys with vehicle ownership check, seating capacity check (Bike = strictly 1 seat; Car = 1-8 seats), and future departure validation.
  - `GET /api/v1/rides`: Multi-parameter ride search & discovery engine with origin, destination, date, vehicleType, and rideType filtering, sorting by departure time or price, and database-level pagination.
  - `GET /api/v1/rides/:id`: Public ride details with route timeline, public driver profile (name, bio, verified badge; non-sensitive), and vehicle information.
  - `GET /api/v1/rides/driver/mine`: Driver ride dashboard endpoint retrieving all published rides categorized into active, past, and cancelled.
  - `PATCH /api/v1/rides/:id`: Edit mutable parameters (pickup point, dropoff point, price per seat, notes) for scheduled rides owned by the authenticated driver.
  - `POST /api/v1/rides/:id/cancel`: Cancellation endpoint transitioning scheduled rides to `CANCELLED` status with validation preventing cancellation of already completed or cancelled trips.
- [x] **Complete Professional UI Revamp (`apps/web`):**
  - **Zero Emoji Iconography:** Replaced all emojis across the entire web application (Navbar, Hero, SearchForm, FeatureHighlights, CommuteSections, Footer, SafetyBanner, Dashboard, Login, Register, Profile, Vehicles) with standard scalable `lucide-react` SVG icons.
  - **Framer Motion Micro-Animations:** Staggered list animations, smooth modal overlays, interactive card hover states, and seamless tab transitions with `prefers-reduced-motion` compliance.
  - **Skeleton Loaders & Empty States:** Realistic skeleton loaders for search results and ride details avoiding layout shift (CLS), plus actionable empty states for search queries and ride tabs.
  - **New Phase 3 Screens:**
    - `/rides`: Search, multi-facet filtering, sorting, pagination, and animated ride cards.
    - `/offer-ride`: Multi-step publishing wizard with vehicle auto-fill, capacity limits, and route guidelines.
    - `/rides/:id`: Complete trip overview with corridor timeline, driver trust card, and vehicle specifications.
    - `/my-rides`: Driver ride management with Upcoming/Past/Cancelled tabs, Edit Modal, and Cancel Confirmation Modal.
- [x] **Automated Test Coverage:**
  - 43 backend integration tests (`rides.test.ts`, `vehicles.test.ts`, `auth.test.ts`, `health.test.ts`).
  - 17 frontend unit & component tests (`App.test.tsx`, `Phase2.test.tsx`, `Phase3.test.tsx`).
  - Total: **60 automated tests** passing across the monorepo.

### Intentionally Deferred to Future Phases:

- ❌ **Booking & Concurrency-Safe Seat Allocation:** Scheduled for Phase 4.
- ❌ **GraphQL & Mapping/Route Integrations:** Scheduled for Phase 5.
- ❌ **Real Government ID & Vehicle Verification Workflows:** Scheduled for Phase 5/6.
- ❌ **In-app Chat & Passenger Ratings:** Scheduled for Phase 6.

---

## 3. Technology Stack

| Layer            | Technologies                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------- |
| **Monorepo**     | npm Workspaces, TypeScript 5, Concurrently                                                  |
| **Frontend**     | React 18, TypeScript, Vite, React Router 6, Framer Motion, Lucide React, Modern CSS Tokens  |
| **Backend API**  | Node.js (v20/v22 LTS), Express.js, Zod, Bcrypt, JWT, Cookie-Parser, Helmet, CORS            |
| **Database**     | MySQL 8.0 (`mysql2` connection pool, SQL migrations, composite performance indexes, Docker) |
| **Testing**      | Vitest, Supertest, React Testing Library, JSDOM (60 tests passing)                          |
| **Code Quality** | ESLint 9, Prettier, TypeScript Strict Mode                                                  |
| **CI / CD**      | GitHub Actions with automated MySQL 8.0 service & migrations container                      |

---

## 4. Quickstart & Local Setup

### Prerequisites

- **Node.js:** `>= 20.0.0` (Recommended: Node.js 22 LTS)
- **npm:** `>= 10.0.0`
- **Docker & Docker Compose:** Required for containerized MySQL 8.0

### Step-by-Step Setup

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Configure Environment Variables:**

   ```bash
   cp .env.example .env
   ```

   _(Review `.env`. By default, `DB_PORT=3307` is configured to prevent port collision with any native host MySQL on port 3306)._

3. **Start the MySQL Database Container:**

   ```bash
   docker compose up -d
   ```

   _Verify container health with `docker ps`._

4. **Execute Database Migrations:**

   ```bash
   npm run db:migrate
   ```

   _This automatically creates `ridemitra_dev`, the `migrations` tracking table, and applies all pending SQL migrations._

5. **Start Development Servers:**
   ```bash
   npm run dev
   ```
   - **Web App:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:4000](http://localhost:4000)
   - **Health Probe:** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
   - **DB Readiness Probe:** [http://localhost:4000/api/v1/ready](http://localhost:4000/api/v1/ready)

---

## 5. Available Scripts

Execute from the repository root:

```bash
# Run both API and Web concurrently in dev mode
npm run dev

# Run database migrations against configured MySQL instance
npm run db:migrate

# Reset database (WARNING: drops all tables in development and reapplies migrations)
npm run db:reset

# Run TypeScript type check across all workspaces (@ridemitra/shared, api, web)
npm run typecheck

# Run ESLint across all workspaces
npm run lint

# Check code formatting with Prettier
npm run format

# Auto-format all code with Prettier
npm run format:write

# Run automated test suites (43 API tests + 17 Web tests = 60 tests)
npm test

# Build production artifacts for shared, api, and web
npm run build
```

---

## 6. REST API Reference (Phases 1, 2 & 3)

All responses follow a consistent schema:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

### Authentication Endpoints

#### `POST /api/v1/auth/register`

Creates a new user profile, issues a JWT session, and sets an `HttpOnly` cookie.

- **Rate Limit:** 5 requests / 15 minutes.
- **Request Body:**
  ```json
  {
    "name": "Priyank Danavle",
    "email": "priyank@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c1f7b445-635c-4458-ba68-45b0a3aa46da",
        "email": "priyank@example.com",
        "name": "Priyank Danavle",
        "role": "USER",
        "phone": null,
        "bio": null,
        "isVerified": false,
        "createdAt": "2026-10-18T09:12:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "message": "Registration successful."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (short password, invalid email).
  - `409 Conflict`: Account with this email already exists.

#### `POST /api/v1/auth/login`

Authenticates existing credentials, creates an active session in the database, and sets the session cookie.

- **Rate Limit:** 5 requests / 15 minutes.
- **Request Body:**
  ```json
  {
    "email": "priyank@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "...", "email": "...", "name": "...", "role": "USER" },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "message": "Login successful."
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Generic error message (`Invalid email or password`) to prevent account enumeration.

#### `POST /api/v1/auth/logout`

Revokes the session token in the MySQL `sessions` table and clears the session cookie.

- **Headers:** Cookie `ridemitra_session` or `Authorization: Bearer <token>`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": null,
    "message": "Logged out successfully."
  }
  ```

#### `GET /api/v1/auth/me`

Retrieves the currently authenticated user's profile.

- **Headers:** Cookie `ridemitra_session` or `Authorization: Bearer <token>`
- **Success Response (200 OK):** Returns `UserSafeProfile`.
- **Error Response:** `401 Unauthorized` if session is missing, invalid, expired, or revoked.

---

### User Profile Endpoints

#### `GET /api/v1/users/profile`

Alternative profile retrieval endpoint (equivalent to `/auth/me`).

#### `PATCH /api/v1/users/profile`

Updates mutable profile fields for the authenticated user.

- **Mass-Assignment Guard:** Payloads containing unrecognized or privileged keys (`role`, `isVerified`, `id`, `password_hash`) are strictly rejected with `400 Bad Request`.
- **Request Body:**
  ```json
  {
    "name": "Priyank Danavle",
    "phone": "+919876543210",
    "bio": "Daily commuter from Surat to Vadodara."
  }
  ```
- **Success Response (200 OK):** Returns updated `UserSafeProfile`.

---

### Vehicle Management Endpoints

All vehicle routes require authentication and enforce strict user tenant isolation.

#### `GET /api/v1/vehicles`

Lists all active vehicles registered to the authenticated user.

- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "vehicles": [
        {
          "id": "e2d830b5-e0bb-432a-bd12-f24faea9079a",
          "userId": "c1f7b445-635c-4458-ba68-45b0a3aa46da",
          "type": "CAR",
          "make": "Hyundai",
          "model": "i20",
          "year": 2022,
          "registrationNumber": "GJ-05-AB-1234",
          "capacity": 4,
          "color": "Polar White",
          "isVerified": false,
          "isActive": true,
          "createdAt": "2026-10-18T09:15:00.000Z"
        }
      ]
    }
  }
  ```

#### `POST /api/v1/vehicles`

Registers a new vehicle for the authenticated user.

- **Validation Rules:**
  - `type`: `'CAR'` or `'BIKE'`.
  - `capacity`: If `BIKE`, capacity must be strictly `1`. If `CAR`, capacity must be between `1` and `8`.
  - `registrationNumber`: 4 to 20 uppercase alphanumeric/hyphen characters.
  - `isVerified`: Always defaults to `false`.
- **Request Body:**
  ```json
  {
    "type": "CAR",
    "make": "Hyundai",
    "model": "i20",
    "year": 2022,
    "registrationNumber": "GJ-05-AB-1234",
    "capacity": 4,
    "color": "Polar White"
  }
  ```
- **Success Response (201 Created):** Returns created vehicle object.
- **Error Responses:**
  - `400 Bad Request`: Validation failure (e.g., Bike with capacity > 1).
  - `409 Conflict`: Registration number already registered in the system.

#### `GET /api/v1/vehicles/:id`

Retrieves a specific vehicle.

- **Tenant Isolation:** If vehicle does not exist or belongs to another user, returns `404 Not Found`.

#### `PATCH /api/v1/vehicles/:id`

Updates vehicle details (`make`, `model`, `year`, `color`, `capacity`).

- **Authorization:** Only the owner can update. Returns `404 Not Found` if accessing another user's vehicle.

#### `DELETE /api/v1/vehicles/:id`

Soft-deactivates the vehicle (`is_active = FALSE`). Preserves historical ride integrity for future Phase 3/4 ride references.

---

### Ride Management Endpoints (Phase 3)

#### `POST /api/v1/rides`

Publishes a new carpool or bikepool ride. Requires authentication and vehicle ownership.

- **Validation Rules:**
  - `departureTime`: Must be an ISO 8601 string in the future (`> NOW()`).
  - `vehicleId`: Must reference an active vehicle owned by the authenticated driver.
  - `availableSeats`: If vehicle is `BIKE`, capacity is strictly `1`. If `CAR`, seats must be between `1` and the vehicle's maximum seating capacity.
  - `type`: `'CITY'` or `'INTERCITY'`.
  - `pricePerSeat`: Optional non-negative integer (in INR).
- **Request Body:**
  ```json
  {
    "vehicleId": "e2d830b5-e0bb-432a-bd12-f24faea9079a",
    "type": "INTERCITY",
    "origin": "Surat",
    "destination": "Ahmedabad",
    "pickupPoint": "VR Mall, Dumas Road",
    "dropoffPoint": "ISCON Cross Roads, SG Highway",
    "departureTime": "2026-10-25T07:30:00.000Z",
    "availableSeats": 3,
    "pricePerSeat": 350,
    "description": "Daily corporate commuter travelling via NH48. AC ride with trunk space."
  }
  ```
- **Success Response (201 Created):** Returns created `Ride` object.
- **Error Responses:**
  - `400 Bad Request`: Departure time in past, seat count exceeding vehicle capacity, or bike with >1 seat.
  - `403 Forbidden`: Authenticated user does not own the vehicle.

#### `GET /api/v1/rides`

Search and discover scheduled rides matching criteria with database-level pagination.

- **Query Parameters:**
  - `origin` (optional): Origin city or locality substring search.
  - `destination` (optional): Destination city or locality substring search.
  - `date` (optional): Specific departure date (`YYYY-MM-DD`).
  - `vehicleType` (optional): `'CAR'` or `'BIKE'`.
  - `type` (optional): `'CITY'` or `'INTERCITY'`.
  - `sortBy` (optional): `'departureTime'` (default) or `'price'`.
  - `sortOrder` (optional): `'asc'` (default) or `'desc'`.
  - `page` (optional): Page number (default: `1`).
  - `limit` (optional): Items per page (default: `10`, max: `50`).
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "7b0a8cd1-59f7-4148-be22-df38d9fca8cf",
          "driverId": "c1f7b445-635c-4458-ba68-45b0a3aa46da",
          "vehicleId": "e2d830b5-e0bb-432a-bd12-f24faea9079a",
          "type": "INTERCITY",
          "origin": "Surat",
          "destination": "Ahmedabad",
          "pickupPoint": "VR Mall, Dumas Road",
          "dropoffPoint": "ISCON Cross Roads, SG Highway",
          "departureTime": "2026-10-25T07:30:00.000Z",
          "totalSeats": 3,
          "availableSeats": 3,
          "pricePerSeat": 350,
          "description": "Daily corporate commuter travelling via NH48.",
          "status": "SCHEDULED",
          "driver": {
            "id": "c1f7b445-635c-4458-ba68-45b0a3aa46da",
            "name": "Priyank Danavle",
            "bio": "Daily commuter from Surat to Ahmedabad.",
            "isVerified": false,
            "createdAt": "2026-10-18T09:12:00.000Z"
          },
          "vehicle": {
            "id": "e2d830b5-e0bb-432a-bd12-f24faea9079a",
            "type": "CAR",
            "make": "Hyundai",
            "model": "i20",
            "year": 2022,
            "color": "Polar White",
            "capacity": 4
          }
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

#### `GET /api/v1/rides/:id`

Retrieves public details for a specific ride, including the driver's non-sensitive public profile and vehicle specifications.

- **Success Response (200 OK):** Returns complete `Ride` entity with embedded `driver` and `vehicle`.
- **Error Response:** `404 Not Found` if the ride does not exist.

#### `GET /api/v1/rides/driver/mine`

Retrieves all rides published by the currently authenticated driver, including scheduled, completed, and cancelled rides.

- **Headers:** Authentication required (Cookie or `Authorization: Bearer <token>`).
- **Success Response (200 OK):** Returns `{ "rides": Ride[] }`.

#### `PATCH /api/v1/rides/:id`

Updates mutable details of a scheduled ride (pickup point, dropoff point, price per seat, notes).

- **Authorization:** Only the driver who created the ride can update it.
- **Rules:** Cannot modify a ride that is already `CANCELLED` or `COMPLETED`.

#### `POST /api/v1/rides/:id/cancel`

Cancels a scheduled ride.

- **Authorization:** Only the driver who created the ride can cancel it.
- **Rules:** Transitions status to `CANCELLED`. Idempotent rejection if the ride was already cancelled or completed.

---

## 7. Security Decisions & Design Trade-offs

1. **Dual Token Delivery (Cookie + Header):**
   - In browser environments, tokens are stored in `HttpOnly`, `SameSite=Lax` cookies, preventing XSS access to tokens.
   - For automated testing, mobile clients, and REST consumers, the `Authorization: Bearer <token>` header is supported identically.
2. **Database-Backed Session Revocation:**
   - Instead of purely stateless JWTs where logout cannot invalidate tokens until expiration, RideMitra stores a SHA-256 hash of each active JWT in the `sessions` table.
   - On logout, the token is marked revoked immediately (`revoked_at = NOW()`), blocking replay attacks.
   - Storing SHA-256 hashes rather than raw tokens protects users if database backups are ever inspected.
3. **Account Enumeration Mitigation:**
   - Login failures return a generic `Invalid email or password` (HTTP 401) without revealing whether the email exists.
4. **Rate Limiting:**
   - Registration and login endpoints are guarded with a rate limiter (`max: 5` attempts per 15 minutes per IP), mitigating brute force attacks.
5. **No Fake Verifications:**
   - Vehicle and user profiles explicitly default `is_verified = FALSE`. The UI displays clear "Unverified" badges until real document verification workflows are introduced.

---

## 8. Project Documentation

Detailed engineering documentation is located in the `docs/` folder:

- [Product Overview & Scope](docs/overview.md)
- [System Architecture & Hosting Analysis](docs/architecture.md)
- [Phase-wise Roadmap & Acceptance Criteria](docs/roadmap.md)
- [Local Development Guide](docs/development.md)

---

## 9. License

This project is licensed under the MIT License.
