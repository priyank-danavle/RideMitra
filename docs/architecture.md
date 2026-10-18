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
