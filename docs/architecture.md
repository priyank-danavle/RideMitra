# RideMitra — System Architecture & Design

## 1. Architecture Overview

RideMitra is engineered as a clean, modular monorepo that separates client presentation, backend business logic, shared contracts, and database schema migrations. The architecture prioritizes separation of concerns, strict type safety end-to-end, deterministic deployment, and robust transactional consistency.

```
                          ┌──────────────────────────────────────┐
                          │         Client Layer (Web)           │
                          │   React + Vite + TypeScript (SPA)    │
                          └──────────────────┬───────────────────┘
                                             │  HTTPS / JSON REST
                                             ▼
                          ┌──────────────────────────────────────┐
                          │         API Gateway / Server         │
                          │      Express.js + TypeScript         │
                          │   (CORS, Helmet, Zod Validation,     │
                          │    Auth Middleware, Error Handler)   │
                          └──────────────────┬───────────────────┘
                                             │
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
         ┌──────────────────────────────┐          ┌─────────────────────────────┐
         │     Relational Database      │          │     External Services       │
         │   MySQL 8.0 (Transactional)  │          │   (Phase 5+: Geocoding,     │
         │   - Users & Profiles         │          │    Route APIs, Maps)        │
         │   - Vehicles                 │          └─────────────────────────────┘
         │   - Rides & Waypoints        │
         │   - Bookings & Transactions  │
         └──────────────────────────────┘
```

---

## 2. Monorepo Organization

The project employs an **npm workspaces** monorepo layout:

```text
ridemitra/
├── apps/
│   ├── web/                    # React 18+ SPA (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components & layouts
│   │   │   ├── pages/          # View components / routed screens
│   │   │   ├── lib/            # Typed API client and utilities
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── types/          # Frontend-specific type definitions
│   │   │   └── styles/         # Modern CSS styles & design tokens
│   │   ├── public/             # Static public assets
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/                    # Express.js REST API (Node.js + TypeScript)
│       ├── src/
│       │   ├── config/         # Environment variables & runtime settings (Zod)
│       │   ├── controllers/    # HTTP route handlers
│       │   ├── services/       # Domain business logic
│       │   ├── middleware/     # CORS, error handling, request logging
│       │   ├── routes/         # Express router definitions
│       │   ├── app.ts          # Express application initialization & middleware setup
│       │   └── server.ts       # HTTP listener & graceful shutdown handlers
│       ├── tests/              # Automated unit and integration tests (Supertest)
│       └── package.json
├── packages/
│   └── shared/                 # Isomorphic types, constants, and validation schemas
│       ├── src/
│       │   ├── types.ts        # Shared domain and DTO types
│       │   └── index.ts        # Shared package entrypoint
│       ├── package.json
│       └── tsconfig.json
├── database/                   # Database migrations and seeding
│   ├── migrations/             # Version-controlled schema migrations
│   ├── seeds/                  # Development seed datasets
│   └── README.md               # Migration guidance and conventions
├── docs/                       # Product and technical documentation
├── .github/
│   └── workflows/              # GitHub Actions CI/CD workflows
├── docker-compose.yml          # Local MySQL development environment
├── .env.example                # Canonical non-secret environment template
└── package.json                # Monorepo root workspace configuration
```

---

## 3. Technology Stack Evaluation & Hosting Analysis

### 3.1 Frontend Target: Cloudflare Pages

- **Fit:** Outstanding. React + Vite produces a compiled static Single Page Application (HTML, JS, CSS) perfectly suited for Cloudflare Pages global Edge CDN.
- **Cost / Limits:** Generous free tier (unlimited requests, 500 builds/month). Zero cold starts.

### 3.2 Backend Target & Runtime Compatibility: Cloudflare Workers vs Node.js Server

#### The Cloudflare Workers Runtime Reality:

1. **Runtime Architecture:** Cloudflare Workers run on the V8 engine (workerd runtime), not standard Node.js. Although Node.js compatibility flags (`nodejs_compat`) have matured, they do not provide 100% parity with native Node.js OS primitives (e.g., standard TCP sockets, process signals like `SIGTERM`, native C++ bindings).
2. **Framework Compatibility:** Standard Express.js relies heavily on Node.js `http.IncomingMessage` and `http.ServerResponse` streams. While adapters like `@hono/node-server` or `itty-router` are native to Workers, running full Express on Workers requires polyfill bridges that can introduce latency and edge cases.
3. **Database Driver & Connection Pool:** Traditional MySQL connection pools (`mysql2`) expect persistent raw TCP sockets. On Cloudflare Workers, raw TCP outbound connections require Cloudflare Hyperdrive or specialized HTTP-based database drivers (e.g., Cloudflare D1 or PlanetScale HTTP API). Hyperdrive provides connection pooling for standard MySQL/Postgres protocols, but requires a paid Cloudflare Workers subscription ($5/mo) in many production scenarios.
4. **Target Strategy Recommendation:**
   - **Primary Local & Production Backend:** Standard Node.js LTS (v20/v22) runtime with Express.js and standard MySQL connection pooling. Deployable seamlessly to containerized platforms (Railway, Render, Fly.io, AWS App Runner, or a VPS/DigitalOcean droplet).
   - **Cloudflare Edge Strategy:** If deploying to Cloudflare Workers is mandated in Phase 7, the modular architecture enables swapping the server adapter or running behind a reverse proxy, while database queries route through Cloudflare Hyperdrive or an HTTP proxy adapter.

### 3.3 Database Selection: MySQL 8.0

- **Why MySQL:** RideMitra requires strict ACID transactions for booking states, seat decrementing under concurrent user requests, foreign key constraints between drivers, rides, and bookings, and relational indexing.
- **Migration Strategy:** Version-controlled SQL migrations executed in deterministic sequential order.
- **No Premature Databases:** MongoDB is avoided in early phases. An event store or flexible document schema will only be evaluated if a concrete requirement (such as unstructured telemetry or search logs) justifies it in Phase 8.

---

## 4. Security Architecture

1. **Strict Transport & Headers:** Helmet middleware configures Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), and standard protective headers.
2. **Explicit CORS:** Origin restrictions configured via whitelist matching `ALLOWED_ORIGINS` environment variables. Wildcard `*` is prohibited in production.
3. **Configuration Hygiene:** Zero hardcoded credentials. All runtime variables are validated at startup with **Zod** schema parsing. Missing or invalid variables immediately abort boot.
4. **Input Sanitization & Server-side Validation:** Client inputs are treated as untrusted. Server-side validation parses payload structures before business logic is invoked.
5. **Least-Privilege Database Access:** Database accounts for application runtime have restricted DDL privileges; migrations run under dedicated administrative roles.
6. **Graceful Shutdown:** The Node.js HTTP server captures `SIGTERM` and `SIGINT` signals, closing active sockets and terminating background connections cleanly before process exit.

---

## 5. Phase 2 Architecture: Authentication, Profiles & Vehicles

### 5.1 Authentication & Session Lifecycle

```
                     ┌────────────────────────────────────────────────────────┐
                     │                 Browser Client (SPA)                   │
                     └───────────────────────────┬────────────────────────────┘
                                                 │
                                                 │ 1. POST /api/v1/auth/login
                                                 │    { email, password }
                                                 ▼
                     ┌────────────────────────────────────────────────────────┐
                     │                 Auth Route & Controller                │
                     │  - Rate Limiter (5 attempts / 15m)                     │
                     │  - Zod Request Schema Validation                       │
                     └───────────────────────────┬────────────────────────────┘
                                                 │
                                                 │ 2. Fetch user by email
                                                 ▼
                     ┌────────────────────────────────────────────────────────┐
                     │                     MySQL Database                     │
                     │  - users table (email normalized to lowercase)         │
                     │  - bcrypt.compare(password, password_hash)             │
                     └───────────────────────────┬────────────────────────────┘
                                                 │
                                                 │ 3. Sign JWT & hash with SHA-256
                                                 ▼
                     ┌────────────────────────────────────────────────────────┐
                     │                  Token & Session Service               │
                     │  - Insert session (user_id, token_hash, expires_at)    │
                     └───────────────────────────┬────────────────────────────┘
                                                 │
                                                 │ 4. Set HttpOnly Cookie & return user
                                                 ▼
                     ┌────────────────────────────────────────────────────────┐
                     │     Response: Set-Cookie ridemitra_session + User      │
                     └────────────────────────────────────────────────────────┘
```

#### Dual Authentication Strategy

- **Web App (Browser):** Uses `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookies to eliminate token theft via Cross-Site Scripting (XSS).
- **REST / API Clients:** Supports standard `Authorization: Bearer <jwt>` HTTP header fallback for mobile or command-line clients.

#### Active Revocation via Hashed Session Storage

- Pure stateless JWTs cannot be revoked upon logout until expiration.
- RideMitra records each issued session in MySQL `sessions` table.
- Instead of storing raw JWTs, the database stores `SHA-256(jwt)`.
- On `POST /api/v1/auth/logout`, the server sets `revoked_at = NOW()`.
- Future requests with that token immediately fail authentication with `401 Unauthorized`.

### 5.2 User Profile & Mass Assignment Protection

- User profiles expose non-sensitive fields (`id`, `name`, `email`, `role`, `phone`, `bio`, `isVerified`, `createdAt`).
- Sensitive attributes (`password_hash`, internal timestamps) are stripped.
- In `PATCH /api/v1/users/profile`, Zod's `.strict()` parser guarantees that any attempt to update privileged fields (`role`, `isVerified`, `id`, `email`) returns `400 Bad Request`.

### 5.3 Vehicle Management & Tenant Isolation

- Every vehicle record belongs to a specific user (`user_id`).
- All vehicle queries enforce ownership filtering:
  ```sql
  SELECT * FROM vehicles WHERE id = ? AND user_id = ? AND is_active = TRUE;
  ```
- If a user attempts to view, edit, or delete another user's vehicle, the API responds with `404 Not Found` (avoiding disclosure of vehicle existence across users).
- **Capacity Rules:**
  - `CAR`: 1 to 8 passenger seats.
  - `BIKE`: Strictly 1 passenger seat (driver + 1 pillion rider).
- **Soft Deactivation:** `DELETE /api/v1/vehicles/:id` sets `is_active = FALSE`. Historical records remain intact for future Phase 3/4 ride references and audit trails.
- **Verification Integrity:** All vehicles default `is_verified = FALSE` and cannot be self-verified through the API.

---

## 6. Phase 3 Architecture: Ride Management, Discovery & Performance Indexing

### 6.1 Ride Lifecycle & State Transitions

```
                    ┌────────────────────────────┐
                    │         SCHEDULED          │ ◄── Ride published (departure in future)
                    └──────────────┬─────────────┘
                                   │
                    ┌──────────────┴─────────────┐
                    ▼                            ▼
     ┌────────────────────────────┐  ┌────────────────────────────┐
     │           ACTIVE           │  │         CANCELLED          │
     │      (Trip in progress)    │  │    (Cancelled by driver)   │
     └──────────────┬─────────────┘  └────────────────────────────┘
                    │
                    ▼
     ┌────────────────────────────┐
     │         COMPLETED          │
     │      (Trip finished)       │
     └────────────────────────────┘
```

- **Creation Invariants:**
  - Driver must own the associated vehicle (`vehicle.user_id = driver.id`).
  - Vehicle must be active (`is_active = TRUE`).
  - Available seats must not exceed the vehicle's capacity.
  - Bikepool rides (`BIKE`) are strictly restricted to 1 passenger seat.
  - Departure time must be in the future (`departure_time > NOW()`).
- **Cancellation Policy:**
  - Drivers can only cancel rides in `SCHEDULED` status that they own.
  - Cancelling an already cancelled or past ride is prevented.
  - Cancelled rides are automatically filtered out from active passenger search queries.

### 6.2 Discovery & Search Optimization

To ensure fast search queries across thousands of active journeys, the database utilizes composite indexes:

1. **`idx_rides_discovery (status, departure_time, available_seats)`**:
   - Enables constant-time pruning of cancelled rides, past rides, and fully-booked rides (`status = 'SCHEDULED' AND departure_time >= NOW() AND available_seats >= 1`).
2. **`idx_rides_route (origin, destination, status)`**:
   - Accelerates exact-match city and corridor queries.
3. **`idx_rides_driver (driver_id, status)`**:
   - Powers driver dashboard queries and history lookups.
4. **`idx_rides_vehicle (vehicle_id)`**:
   - Maintains relational integrity and prevents orphaned rides when vehicles are queried.

### 6.3 Privacy & Public vs Private Profile Boundaries

- **Public Views (`/rides`, `/rides/:id`):**
  - Return `DriverPublicProfile`: `id`, `name`, `bio`, `isVerified`, `createdAt`.
  - Sensitive contact data (`email`, `phone`) is strictly stripped from API payloads to prevent scraping and harassment.
  - Vehicle summaries expose `make`, `model`, `year`, `color`, `type`, and `capacity`.
- **Private Views (`/my-rides`, `/profile`):**
  - Only the authenticated driver can access full vehicle details, edit ride parameters, and perform cancellations.

### 6.4 Professional UI Architecture

- **Iconography System:** All raw unicode emojis are completely eliminated across the application in favor of `lucide-react` scalable SVG icons with standardized sizes (`14px`–`32px`).
- **Micro-Animations:** Powered by `framer-motion` for page-level stagger effects, interactive card hover elevations, and smooth modal overlays with automatic `prefers-reduced-motion` compliance.
- **Loading & Skeleton States:** Skeleton loaders reflect the exact structural geometry of cards and details, avoiding layout shifts (CLS).
- **Responsive Layout:** Grid and flexbox layouts adapt smoothly from mobile viewport widths (360px) to widescreen desktop displays.

---

## 7. Phase 4 Architecture: Booking Engine, Seat Concurrency & Navigation Animation Polish

### 7.1 Booking Lifecycle & State Machine

```
                    ┌────────────────────────────┐
                    │          PENDING           │ ◄── Passenger requests booking
                    └──────────────┬─────────────┘
                                   │
                    ┌──────────────┴─────────────┐
                    ▼                            ▼
     ┌────────────────────────────┐  ┌────────────────────────────┐
     │         CONFIRMED          │  │          REJECTED          │
     │   (Driver accepts request; │  │   (Driver rejects request; │
     │    seats held atomically)  │  │    zero seats allocated)   │
     └──────────────┬─────────────┘  └────────────────────────────┘
                    │
     ┌──────────────┴─────────────┐
     ▼                            ▼
┌────────────────────────────┐  ┌────────────────────────────┐
│         COMPLETED          │  │         CANCELLED          │
│   (Ride finished; trip     │  │ (Passenger/driver cancels; │
│    settled successfully)   │  │  held seats released once) │
└────────────────────────────┘  └────────────────────────────┘
```

- **Passenger Request (`PENDING`):**
  - Authenticated passengers select seat quantities within available capacity and vehicle limits (max 1 for bikepool, max min(available, 6) for carpool).
  - Own-ride booking is strictly blocked at the database and repository layers (`ride.driver_id !== passenger_id`).
  - Rides in `CANCELLED`, `COMPLETED`, or with past departure times cannot be booked.
  - Price calculation is **strictly server-side**: `price_per_seat = ride.price_per_seat`, `total_price = seats_booked * price_per_seat`. Client-supplied totals are never accepted.
- **Driver Decision (`CONFIRMED` / `REJECTED`):**
  - Only the driver owning the ride can accept or reject pending requests.
  - Confirmation atomically locks the ride row, checks capacity, decrements `available_seats`, and transitions status to `CONFIRMED`.
- **Cancellation (`CANCELLED`):**
  - Passengers can cancel their own `PENDING` or `CONFIRMED` bookings before departure.
  - Drivers can cancel confirmed passenger reservations if necessary.
  - Cancelling a `CONFIRMED` booking atomically increments `available_seats` back to the ride exactly once. Cancelling a `PENDING` booking releases 0 seats since pending requests never held capacity.

### 7.2 Seat Allocation Strategy & Authoritative State

- **Policy:** Seats are officially held and deducted from `rides.available_seats` **upon driver confirmation (`CONFIRMED`)**, not upon submission of a pending request.
- **Rationale:** Prevents speculative, unconfirmed passenger requests from prematurely exhausting ride capacity and denying access to other commuters.
- **Authoritative Capacity:** `rides.available_seats` is the authoritative source of available capacity. When a booking confirms, `available_seats = available_seats - seats_booked`.
- **Idempotency Protection:** Status transitions verify `current_status === 'PENDING'` before confirming, guaranteeing that network retries or repeated clicks cannot double-allocate seats.

### 7.3 Concurrency Control Strategy: Preventing Double-Booking

To prevent race conditions where concurrent requests compete for the last remaining seat, RideMitra uses **MySQL InnoDB Row-Level Locking (`SELECT ... FOR UPDATE`) inside atomic transactions**:

```sql
START TRANSACTION;

-- 1. Orderly row lock on the booking record
SELECT * FROM bookings WHERE id = ? FOR UPDATE;

-- 2. Row lock on the ride record (authoritative capacity boundary)
SELECT * FROM rides WHERE id = ? FOR UPDATE;

-- 3. In-transaction capacity verification
-- IF available_seats < seats_booked THEN ROLLBACK & Return 409 Conflict

-- 4. Atomic capacity decrement and status transition
UPDATE rides SET available_seats = available_seats - ? WHERE id = ?;
UPDATE bookings SET status = 'CONFIRMED' WHERE id = ?;

COMMIT;
```

#### Key Guarantees:

1. **Isolated Authoritative Read:** Capacity is read from the database within the lock boundary. No cached or stale read is trusted.
2. **Deterministic Lock Ordering:** In multi-record transactions, `bookings` is locked first, followed by `rides`. Consistent acquisition ordering prevents deadlocks between concurrent operations.
3. **Rollback Safety:** If capacity is insufficient or an unhandled exception occurs, the transaction automatically issues `ROLLBACK`, restoring all rows to their original state.
4. **Verified by Concurrency Tests:** Tested using `Promise.all` issuing parallel competing confirmation requests against a single remaining seat. Exactly one transaction commits; all competing requests fail gracefully with HTTP 409 Conflict and capacity remains exactly 0 without negative overbooking.

### 7.4 Animated Page Transitions & Motion System

To eliminate static page switches between navigation links, RideMitra implements a cohesive motion architecture:

- **Library:** `framer-motion` integrated with `react-router-dom` v6.
- **Route-Level Animation Shell:** `<AnimatedRoutes>` wraps all routes in `<AnimatePresence mode="wait">` using `location.pathname` as the transition key.
- **Page Transition Wrapper:** `<PageTransition>` standardizes enter/exit animations:
  - Exit: Smooth fade out (`opacity: 0, y: -6px`, duration 150ms).
  - Enter: Subtle rise and fade in (`opacity: 1, y: 0`, duration 200ms, ease: `[0.22, 1, 0.36, 1]`).
  - Automatic `ScrollToTop` reset on route change.
- **Active Navigation Indicators:** Desktop navbar links utilize Framer Motion's shared layout animation (`layoutId="navbar-indicator"`) to smoothly glide the indicator pill beneath active routes (Dashboard, My Rides, My Bookings, Find Rides).
- **Accessibility & Reduced Motion:** Integrated `useReducedMotion()` from Framer Motion automatically disables transform translations and reduces transitions to instant fades when `prefers-reduced-motion: reduce` is enabled.
