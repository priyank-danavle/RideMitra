# RideMitra — Phase-wise Development Roadmap

This document outlines the sequential engineering roadmap for **RideMitra**. Each phase establishes a complete, working, testable milestone. Development strictly proceeds one phase at a time; future phase capabilities are never claimed until backed by verified code and automated tests.

---

## Roadmap Overview

| Phase       | Title                           | Primary Focus                                                           | Status          |
| ----------- | ------------------------------- | ----------------------------------------------------------------------- | --------------- |
| **Phase 1** | Foundation & Project Setup      | Monorepo scaffolding, web shell, API skeleton, CI/CD, documentation     | **In Progress** |
| **Phase 2** | Authentication & User Profiles  | JWT/Session auth, user & driver roles, profile and vehicle management   | Planned         |
| **Phase 3** | Ride Management & Search        | Ride publishing, city/intercity routes, search filters, database schema | Planned         |
| **Phase 4** | Booking & Seat Management       | Atomic booking requests, driver approval, concurrency handling          | Planned         |
| **Phase 5** | GraphQL & External Integrations | GraphQL dashboard queries, maps/geocoding, driver/passenger panels      | Planned         |
| **Phase 6** | Testing & Product Quality       | Integration/E2E testing, security review, performance audit             | Planned         |
| **Phase 7** | Deployment & Public Launch      | Production staging, Cloudflare hosting, MySQL provisioning, SSL         | Planned         |
| **Phase 8** | Advanced Features               | Route intelligence service, telemetry analytics, safety enhancements    | Planned         |

---

## Phase 1 — Foundation and Project Setup (Current Phase)

### Goals

- Establish a production-grade monorepo structure with clean dependency boundaries.
- Configure a responsive, accessible React + TypeScript + Vite frontend shell.
- Configure an Express + TypeScript API server with centralized logging, error handling, and health endpoints.
- Provide reproducible local development via Docker Compose for MySQL.
- Implement strict type checking, linting, formatting, unit tests, and GitHub Actions CI.

### Implementation Tasks

- [x] Inspect workspace and initialize Git version control.
- [x] Create comprehensive architectural, product overview, and roadmap documentation.
- [ ] Set up npm workspaces (`apps/web`, `apps/api`, `packages/shared`).
- [ ] Implement `packages/shared` for isomorphic types and DTO contracts.
- [ ] Implement `apps/api` with Zod environment validation, graceful shutdown, health endpoints (`/api/v1/health`, `/api/v1/ready`), and CORS security.
- [ ] Implement `apps/web` application shell with accessible navigation, hero section, ride search form, commute categories, and real-time backend health connectivity check.
- [ ] Add Docker Compose configuration for local MySQL 8.0 with health checks.
- [ ] Configure ESLint, Prettier, TypeScript strict mode, and automated test runners.
- [ ] Configure GitHub Actions workflow for pull request and push validation.

### Dependencies

- Node.js LTS (v20+ or v22+), npm 10+.

### Acceptance Criteria

1. Clean checkout installs with `npm install` without errors.
2. `npm run dev` boots both frontend and backend concurrently.
3. `npm run lint`, `npm run typecheck`, and `npm test` pass across all workspaces.
4. `npm run build` generates production builds for web, api, and shared packages.
5. `GET /api/v1/health` returns HTTP 200 with JSON payload (`status: "ok"`, timestamp, version).
6. Frontend displays a responsive, accessible UI shell with clearly labeled demo states.
7. No secrets or credentials exist in Git.

### Deliverable

A fully runnable, documented monorepo with verified tests, build scripts, CI automation, and healthy local developer workflow.

---

## Phase 2 — Authentication and User Profiles

### Goals

- Provide secure user registration, login, and session validation.
- Implement role-based capabilities allowing users to seamlessly act as passengers and drivers.
- Enable vehicle registration and profile verification.

### Implementation Tasks

- [ ] Design and apply MySQL schema migrations for `users` and `vehicles` tables.
- [ ] Implement secure password hashing with bcrypt/argon2.
- [ ] Implement JWT or secure HTTP-only cookie session authentication.
- [ ] Add registration and login endpoints with rigorous input validation.
- [ ] Build user profile management endpoints (contact info, emergency contact, bio).
- [ ] Build vehicle management endpoints (make, model, license plate, vehicle type: car/bike).
- [ ] Create frontend login, registration, and profile management screens with accessible forms.
- [ ] Implement protected route guards on frontend and authentication middleware on API.
- [ ] Add unit and integration tests for authentication flows and token invalidation.

### Dependencies

- Phase 1 foundation; MySQL connection pool and migration runner.

### Acceptance Criteria

1. Users can register, log in, and receive secure authentication tokens.
2. Passwords are never stored in plaintext or logged.
3. Users can register multiple vehicles and specify vehicle type.
4. Unauthorized requests to protected endpoints return HTTP 401/403.
5. All auth endpoints are backed by integration tests.

### Deliverable

Working authentication subsystem with user and vehicle management.

---

## Phase 3 — Ride Management and Search

### Goals

- Enable drivers to publish, view, edit, and cancel rides.
- Allow passengers to search for rides matching criteria with fast indexed queries.
- Support both city commuting and intercity travel patterns.

### Implementation Tasks

- [ ] Create database migration for `rides` and `ride_waypoints` tables.
- [ ] Build API endpoints for ride creation (`POST /api/v1/rides`), editing, listing, and cancellation.
- [ ] Enforce driver vehicle validation (e.g., driver must select a registered vehicle).
- [ ] Support flexible ride parameters: origin, destination, departure datetime, total seats, price/contribution per seat, luggage allowance, vehicle type (car/bike).
- [ ] Implement ride search endpoint (`GET /api/v1/rides/search`) with filters for origin, destination, date, and vehicle mode.
- [ ] Add SQL indexes on `departure_time`, `origin_city`, `destination_city`, and `status`.
- [ ] Build frontend ride discovery interface with filters, pagination, and empty/loading states.
- [ ] Build frontend "Offer a Ride" flow for verified drivers.

### Dependencies

- Phase 2 authentication and vehicle records.

### Acceptance Criteria

1. Drivers can create rides with route parameters and available seats.
2. Passengers can search rides and receive filtered results.
3. Search queries execute efficiently using database indexes.
4. Cancelled or past rides are excluded from active search results.

### Deliverable

Functional ride publishing and discovery engine.

---

## Phase 4 — Booking and Seat Management

### Goals

- Implement reliable passenger seat booking requests with driver approval workflows.
- Guarantee transactional consistency and prevent overbooking under concurrent requests.

### Implementation Tasks

- [ ] Create database migration for `bookings` table with status states (`PENDING`, `CONFIRMED`, `REJECTED`, `CANCELLED`).
- [ ] Implement booking creation endpoint (`POST /api/v1/rides/:id/book`).
- [ ] Implement transactional seat decrement logic using MySQL `SELECT ... FOR UPDATE` or atomic decrement queries.
- [ ] Prevent edge cases: self-booking, duplicate active requests for the same ride, booking cancelled or completed rides.
- [ ] Implement driver action endpoints (`POST /api/v1/bookings/:id/accept`, `reject`).
- [ ] Implement booking cancellation with automatic seat replenishment.
- [ ] Build frontend booking management interfaces for both passenger and driver.
- [ ] Add concurrency tests simulating simultaneous seat bookings.

### Dependencies

- Phase 3 ride catalog.

### Acceptance Criteria

1. Concurrent requests cannot exceed available seat capacity.
2. Drivers can accept or reject requests with immediate status reflection.
3. Cancelled bookings restore available seat counts atomically.
4. Unit and concurrency tests verify all booking state transitions.

### Deliverable

Transactionally safe booking and seat allocation subsystem.

---

## Phase 5 — GraphQL and External Integrations

### Goals

- Introduce GraphQL for complex dashboard views requiring flexible, aggregated data.
- Integrate external geocoding and mapping services for address autocomplete and route distance calculation.

### Implementation Tasks

- [ ] Add Apollo Server or Yoga GraphQL handler mounted on `/graphql` for authenticated dashboard queries.
- [ ] Implement GraphQL schemas and resolvers for driver metrics, passenger trip history, and upcoming schedules.
- [ ] Evaluate and integrate geocoding / maps API (e.g., OpenStreetMap / Nominatim or Google Maps Platform) with caching.
- [ ] Implement rate-limiting and circuit breakers for third-party API calls.
- [ ] Build interactive route map preview on ride details screen.
- [ ] Document REST vs GraphQL boundary decisions.

### Dependencies

- Phase 4 booking data.

### Acceptance Criteria

1. Dashboard screens fetch consolidated metrics via a single GraphQL query without over-fetching.
2. Route coordinates and distances are enriched via geocoding services.
3. External API failures degrade gracefully without crashing core workflows.

### Deliverable

Consolidated dashboard reporting via GraphQL and integrated route mapping.

---

## Phase 6 — Testing and Product Quality

### Goals

- Achieve comprehensive test coverage across critical user paths.
- Harden application security, error reporting, and accessibility.

### Implementation Tasks

- [ ] Write integration test suites covering end-to-end booking lifecycles.
- [ ] Implement automated accessibility (a11y) audit for all frontend screens (WCAG AA compliance).
- [ ] Run security audits on dependencies (`npm audit`) and implement OWASP recommendations.
- [ ] Set up structured JSON application logging with request correlation IDs.
- [ ] Benchmark API latency under simulated load.

### Dependencies

- Core application features from Phases 1–5.

### Acceptance Criteria

1. Critical paths have automated integration test coverage.
2. Accessibility tests pass with zero critical violations.
3. Zero high/critical vulnerabilities reported in dependencies.

### Deliverable

Hardened, thoroughly tested, and benchmarked release candidate.

---

## Phase 7 — Deployment and Public Launch

### Goals

- Deploy the frontend to Cloudflare Pages.
- Deploy the backend API to a production-ready Node.js container or compatible runtime with managed MySQL.
- Configure custom domains, TLS, and automated CI/CD deployment pipelines.

### Implementation Tasks

- [ ] Prepare production build configurations and environment variable secrets.
- [ ] Set up managed MySQL instance (e.g., Aiven, PlanetScale, or cloud-hosted MySQL).
- [ ] Configure Cloudflare Pages for `apps/web` with preview and production branches.
- [ ] Configure production API deployment on selected hosting target with health monitoring.
- [ ] Configure DNS, custom domains, and automated SSL.
- [ ] Add CD pipeline in GitHub Actions for automated deployment on `main` branch merges.
- [ ] Conduct live verification of user flows on staging and production.

### Dependencies

- Phase 6 quality verification.

### Acceptance Criteria

1. Production web application accessible via HTTPS on custom domain.
2. API health check returns healthy status with connected database.
3. Automated deployment pipeline executes cleanly on commits to `main`.

### Deliverable

Live, production-deployed RideMitra platform.

---

## Phase 8 — Advanced Features (Post-MVP)

### Goals

- Introduce intelligent route matching and analytics.
- Evaluate MongoDB for flexible activity telemetry logs if justified.
- Build Python/FastAPI route intelligence service for waypoint detours.

### Implementation Tasks

- [ ] Evaluate telemetry use cases to justify MongoDB integration.
- [ ] Implement Python / FastAPI microservice for detour optimization and route scoring.
- [ ] Add passenger-driver real-time notification subsystem.
- [ ] Implement automated user verification and reputation scoring algorithms.

### Acceptance Criteria

1. Route intelligence improves rider matching accuracy.
2. Advanced services operate asynchronously without degrading core transaction reliability.
