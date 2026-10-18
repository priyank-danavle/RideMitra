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

## 2. Current Project Phase: Phase 2 — Authentication, User Profiles & Vehicle Management

The project follows a disciplined [8-Phase Engineering Roadmap](docs/roadmap.md). We have completed **Phase 1** and **Phase 2**.

### Implemented in Phase 2:

- [x] **Relational Schema & Migrations (`database/migrations`):**
  - `001_create_users_table.sql`: Users table with UUID primary keys, normalized lowercase email unique constraint, bcrypt password hashes, roles (`USER`, `ADMIN`), and profile fields.
  - `002_create_sessions_table.sql`: Server-managed sessions table storing SHA-256 hashed JWT tokens for immediate server-side revocation on logout, automatic expiry tracking, and client metadata.
  - `003_create_vehicles_table.sql`: Vehicles table with foreign key to users, vehicle type (`CAR`, `BIKE`), seating capacity constraints, soft-deactivation flag (`is_active`), and unverified default status (`is_verified = FALSE`).
  - Automated migration runner (`database/migrate.ts`) with `npm run db:migrate` and `npm run db:reset`.
- [x] **Secure Authentication Subsystem (`apps/api`):**
  - Registration with duplicate email rejection (409 Conflict) and generic credentials error (401 Unauthorized) to mitigate account enumeration.
  - Password hashing using `bcryptjs` with 12 salt rounds; passwords never stored or logged in plaintext.
  - Dual authentication strategy: Secure `HttpOnly`, `SameSite=Lax` cookies with seamless fallback to `Authorization: Bearer <token>` for non-browser/REST clients.
  - Express rate limiting on auth endpoints (`5 requests per 15 minutes` for register/login) to mitigate brute-force attacks.
  - In-database session revocation on logout.
- [x] **User Profiles & Mass-Assignment Protection:**
  - `GET /api/v1/auth/me` and `GET /api/v1/users/profile` returning non-sensitive fields only.
  - `PATCH /api/v1/users/profile` protected with Zod `.strict()` validation to explicitly block unauthorized elevation of roles, verification status, or IDs.
- [x] **Vehicle Management & Ownership Isolation:**
  - Full CRUD operations: Create, List, Retrieve, Update, and Soft-Deactivate (`DELETE /api/v1/vehicles/:id`).
  - Strict vehicle capacity validation: Bikepool capacity is strictly 1 passenger seat; Carpool is 1–8 passenger seats.
  - Strict tenant isolation: Every query scopes to `user_id = ?`, preventing cross-user vehicle inspection or modification (404/403).
  - Explicit unverified badge/state: Vehicles default to unverified pending future document verification workflows.
- [x] **Polished Frontend Experience (`apps/web`):**
  - React Router v6 pages: `RegisterPage`, `LoginPage`, `DashboardPage`, `ProfilePage`, `VehiclesPage`.
  - Accessible forms with real-time validation, loading spinners, and clear server error handling.
  - Dynamic `Navbar` reflecting authenticated state, active user chip, and logout trigger.
  - `ProtectedRoute` component safeguarding authenticated views.
- [x] **End-to-End Automated Testing:**
  - 31 backend integration tests (`auth.test.ts`, `vehicles.test.ts`, `health.test.ts`).
  - 10 frontend unit & component tests (`App.test.tsx`, `Phase2.test.tsx`).
  - Total: 41 automated tests passing across the monorepo.

### Intentionally Deferred to Future Phases:

- ❌ **Ride Publishing, Routes & Public Ride Search:** Scheduled for Phase 3.
- ❌ **Booking & Concurrency-Safe Seat Allocation:** Scheduled for Phase 4.
- ❌ **GraphQL & Mapping/Route Integrations:** Scheduled for Phase 5.
- ❌ **Real Government ID & Vehicle Verification Workflows:** Scheduled for Phase 5/6.

---

## 3. Technology Stack

| Layer            | Technologies                                                                          |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Monorepo**     | npm Workspaces, TypeScript 5, Concurrently                                            |
| **Frontend**     | React 18, TypeScript, Vite, React Router 6, Modern CSS (Design Tokens, Glassmorphism) |
| **Backend API**  | Node.js (v20/v22 LTS), Express.js, Zod, Bcrypt, JWT, Cookie-Parser, Helmet, CORS      |
| **Database**     | MySQL 8.0 (`mysql2` connection pool, SQL migrations, Docker Compose)                  |
| **Testing**      | Vitest, Supertest, React Testing Library, JSDOM (41 tests passing)                    |
| **Code Quality** | ESLint 9, Prettier, TypeScript Strict Mode                                            |
| **CI / CD**      | GitHub Actions with automated MySQL 8.0 service & migrations container                |

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

# Run automated test suites (31 API tests + 10 Web tests)
npm test

# Build production artifacts for shared, api, and web
npm run build
```

---

## 6. Phase 2 REST API Reference

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
