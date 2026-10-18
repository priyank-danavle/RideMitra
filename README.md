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

## 2. Current Project Phase: Phase 1 — Foundation and Project Setup

The project follows a disciplined [8-Phase Engineering Roadmap](docs/roadmap.md). We are currently in **Phase 1**.

### Implemented in Phase 1:

- [x] **Monorepo Architecture:** npm workspaces orchestrating `apps/web`, `apps/api`, and `packages/shared`.
- [x] **Frontend Foundation (`apps/web`):** Responsive React 18 + Vite + TypeScript application shell featuring accessible search inputs, commute mode selectors (Carpool/Bikepool), regional corridor sections, and live API connectivity badge.
- [x] **Backend Foundation (`apps/api`):** Modular Node.js + Express + TypeScript API server with Zod-validated environment config, Helmet security headers, CORS origin whitelisting, centralized error handling, and graceful shutdown.
- [x] **Health & Readiness Endpoints:** `GET /api/v1/health` (liveness probe) and `GET /api/v1/ready` (readiness probe).
- [x] **Shared Contracts (`packages/shared`):** Isomorphic TypeScript interfaces (`HealthCheckResponse`, `ApiResponse<T>`, `VehicleType`, `RideSearchQuery`) and constants.
- [x] **Local Development & MySQL Setup:** Docker Compose configuration with health check for MySQL 8.0, and template `.env.example`.
- [x] **Quality Automation:** ESLint 9 flat configuration, Prettier code formatting, TypeScript strict mode, Vitest unit and integration test suites, and GitHub Actions CI workflow.
- [x] **Documentation Suite:** [Product Overview](docs/overview.md), [System Architecture](docs/architecture.md), [Development Roadmap](docs/roadmap.md), and [Local Development Guide](docs/development.md).

### Intentionally Deferred to Future Phases:

- ❌ **Authentication & User Profiles:** Scheduled for Phase 2.
- ❌ **Database CRUD, Ride Publishing & Search:** Scheduled for Phase 3.
- ❌ **Booking & Concurrency-Safe Seat Allocation:** Scheduled for Phase 4.
- ❌ **GraphQL & Mapping Integrations:** Scheduled for Phase 5.

_(No mock rides or fabricated user data are presented as real database records.)_

---

## 3. Technology Stack

| Layer            | Technologies                                                               |
| ---------------- | -------------------------------------------------------------------------- |
| **Monorepo**     | npm Workspaces, TypeScript 5, Concurrently                                 |
| **Frontend**     | React 18, TypeScript, Vite, Modern CSS (Design Tokens, Logical Properties) |
| **Backend API**  | Node.js (v20/v22 LTS), Express.js, Zod, Helmet, CORS                       |
| **Database**     | MySQL 8.0 (Containerized via Docker Compose; schema active in Phase 2)     |
| **Testing**      | Vitest, Supertest, React Testing Library, JSDOM                            |
| **Code Quality** | ESLint 9, Prettier, TypeScript Strict Mode                                 |
| **CI / CD**      | GitHub Actions                                                             |

---

## 4. Quickstart & Local Setup

### Prerequisites

- **Node.js:** `>= 20.0.0` (Recommended: Node.js 22 LTS)
- **npm:** `>= 10.0.0`
- **Docker & Docker Compose:** Optional for Phase 1, recommended for MySQL in Phase 2+

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

### 3. Start Development Servers

Start both the API backend and the Vite frontend concurrently:

```bash
npm run dev
```

- **Web Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:4000](http://localhost:4000)
- **Health Endpoint:** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
- **Readiness Endpoint:** [http://localhost:4000/api/v1/ready](http://localhost:4000/api/v1/ready)

---

## 5. Available Scripts

Execute from the repository root:

```bash
# Run both API and Web concurrently in dev mode
npm run dev

# Run TypeScript type check across all packages
npm run typecheck

# Run ESLint across all workspaces
npm run lint

# Format code with Prettier
npm run format:write

# Run automated unit and integration tests
npm test

# Build production artifacts for shared, api, and web
npm run build
```

---

## 6. Docker Development Environment (MySQL)

To launch the local MySQL 8.0 container:

```bash
docker compose up -d
```

To stop the container:

```bash
docker compose down
```

---

## 7. Project Documentation

Detailed engineering documentation is located in the `docs/` folder:

- [Product Overview & Scope](docs/overview.md)
- [System Architecture & Hosting Analysis](docs/architecture.md)
- [Phase-wise Roadmap & Acceptance Criteria](docs/roadmap.md)
- [Local Development Guide](docs/development.md)

---

## 8. License

This project is licensed under the MIT License.
