# RideMitra — Local Development Guide

## 1. Prerequisites

Ensure your local development environment meets the following minimum requirements:

- **Node.js:** `>= 20.0.0` (Recommended: Node.js 22 LTS)
- **npm:** `>= 10.0.0`
- **Docker & Docker Compose:** Optional for Phase 1, recommended for MySQL services in Phase 2+
- **Git:** Version 2.30+

Verify installations:

```bash
node -v
npm -v
docker compose version
```

---

## 2. Quickstart Setup

### Step 1: Clone and Navigate

```bash
cd /path/to/RideMitra
```

### Step 2: Install Dependencies

The project uses **npm workspaces** to manage packages across `apps/` and `packages/` from the root:

```bash
npm install
```

### Step 3: Configure Environment Variables

Copy the root `.env.example` file to create your local `.env`:

```bash
cp .env.example .env
```

Review `.env` to ensure appropriate local ports and settings. In Phase 1, default fallback values allow the API and web apps to start out of the box even without modifications.

### Step 4: Run the Development Servers

Start both the API backend and the Vite frontend concurrently:

```bash
npm run dev
```

By default:

- **Frontend (Web):** `http://localhost:5173`
- **Backend API:** `http://localhost:4000`
- **Health Check Endpoint:** `http://localhost:4000/api/v1/health`
- **Readiness Endpoint:** `http://localhost:4000/api/v1/ready`

---

## 3. Monorepo Scripts Reference

All primary commands are executable from the root of the monorepo:

| Command                | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`          | Runs all workspaces in development mode concurrently                          |
| `npm run build`        | Compiles the shared package, builds API, and generates Vite production bundle |
| `npm run lint`         | Runs ESLint across all workspaces                                             |
| `npm run lint:fix`     | Automatically fixes auto-fixable lint issues                                  |
| `npm run format`       | Checks code formatting with Prettier                                          |
| `npm run format:write` | Formats all files with Prettier                                               |
| `npm run typecheck`    | Executes `tsc --noEmit` across shared, api, and web workspaces                |
| `npm test`             | Runs automated test suites across all workspaces                              |
| `npm run test:watch`   | Runs test runner in interactive watch mode                                    |

### Workspace-Specific Execution

You can also run commands for a specific workspace:

```bash
# Run API only
npm run dev --workspace=@ridemitra/api

# Run Web only
npm run dev --workspace=@ridemitra/web

# Test API only
npm test --workspace=@ridemitra/api

# Test Web only
npm test --workspace=@ridemitra/web
```

---

## 4. Docker Compose Environment (MySQL 8.0)

A local MySQL container is configured in `docker-compose.yml` for database persistence. Note that in **Phase 1**, the application does not yet connect to MySQL, but the container setup is prepared for Phase 2 migrations.

### Starting Local Database:

```bash
docker compose up -d
```

### Stopping Database:

```bash
docker compose down
```

### Checking Database Health:

```bash
docker compose ps
```

---

## 5. Testing & Code Quality Guidelines

### 5.1 Automated Testing

We use **Vitest** for fast, native TypeScript testing across both backend and frontend:

- **API Tests:** Use `supertest` to test HTTP request lifecycle, status codes, headers, and payload structures.
- **Web Tests:** Use `@testing-library/react` and `@testing-library/jest-dom` for component accessibility, user interactions, and rendering tests.

Run all tests:

```bash
npm test
```

### 5.2 Type Safety & Linting

TypeScript strict mode is enabled across all workspaces. No `any` types should be introduced without explicit architectural justification.

```bash
npm run typecheck
npm run lint
```

---

## 6. Troubleshooting

### Port Conflicts

- **Error:** `EADDRINUSE: address already in use :::4000` or `:::5173`
- **Resolution:** Change `PORT=4000` in `.env` or free the occupied port:
  ```bash
  lsof -i :4000
  kill -9 <PID>
  ```

### Workspace Dependency Resolution

- If an update in `packages/shared` is not immediately picked up by `apps/web` or `apps/api`:
  ```bash
  npm run build --workspace=@ridemitra/shared
  ```
  The shared package is pre-built with types so both applications resolve typings seamlessly.

### Clean Reinstall

- If `node_modules` gets corrupted:
  ```bash
  rm -rf node_modules apps/*/node_modules packages/*/node_modules package-lock.json
  npm install
  ```
