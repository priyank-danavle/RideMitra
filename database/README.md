# RideMitra Database Schema & Migrations

## Overview

RideMitra utilizes **MySQL 8.0** as its primary transactional database to guarantee ACID guarantees, transactional isolation for seat allocations, and relational integrity.

## Phase 1 Status

> [!NOTE]
> In **Phase 1**, the application foundation does not establish runtime database connections. The database directory and Docker Compose definitions are provisioned as architecture scaffolding. Application tables and database connections will be implemented starting in **Phase 2 (Authentication and User Profiles)**.

## Structure

- `migrations/`: Sequential versioned SQL migrations (e.g., `001_create_users_table.sql`).
- `seeds/`: Realistic, non-confidential seed fixtures for local development.

## Migration Conventions (Phase 2+)

1. Migrations must be forward-only and repeatable where feasible.
2. Every schema modification must be executed via an explicit migration file committed to version control.
3. Destructive operations (dropping columns/tables) must be phased across multiple deployments to prevent zero-downtime deployment breakage.
