# RideMitra Database Schema & Migrations

## Overview

RideMitra utilizes **MySQL 8.0** as its primary transactional database to guarantee ACID guarantees, transactional isolation for seat allocations, and relational integrity.

## Phase Status (Phase 3 Completed)

The database schema currently includes:

- `001_create_users_table.sql`: Users table with UUID primary keys, normalized email unique constraint, role, profile attributes, and bcrypt hash storage.
- `002_create_sessions_table.sql`: Sessions table storing SHA-256 hashed JWT tokens, client metadata, and revocation timestamps for immediate server-side revocation on logout.
- `003_create_vehicles_table.sql`: Vehicles table with foreign key to users, vehicle type (`CAR`, `BIKE`), registration number, seating capacity, soft-deactivation flag (`is_active`), and verification status (`is_verified`).
- `004_create_rides_table.sql`: Rides table storing published carpools and bikepools with foreign keys to drivers and vehicles, departure times, route information (origin, destination, pickup, dropoff), seat allocation, pricing in INR, lifecycle status (`SCHEDULED`, `ACTIVE`, `COMPLETED`, `CANCELLED`), and composite performance indexes (`idx_rides_discovery`, `idx_rides_route`, `idx_rides_driver`, `idx_rides_vehicle`).

## Structure

- `migrations/`: Sequential versioned SQL migrations (e.g., `001_create_users_table.sql` through `004_create_rides_table.sql`).
- `seeds/`: Realistic, non-confidential seed fixtures for local development.
- `migrate.ts`: TypeScript migration runner with forward execution and `--reset` capabilities.

## Migration Conventions

1. Migrations must be forward-only and repeatable where feasible.
2. Every schema modification must be executed via an explicit migration file committed to version control.
3. Destructive operations (dropping columns/tables) must be phased across multiple deployments to prevent zero-downtime deployment breakage.
4. Database migrations can be executed with `npm run db:migrate` or reset in development with `npm run db:reset`.
