# RideMitra — Maps & Location Architecture (Free MVP)

This document specifies the Phase 5.3 location, mapping, and routing architecture for RideMitra. It describes the provider selections, database schema, usage policies, and graceful fallback strategies.

---

## 1. Architectural Overview

RideMitra implements an open-source, zero-billing maps and location enhancement using:
- **Interactive Map Rendering:** [Leaflet](https://leafletjs.com/) with [React-Leaflet](https://react-leaflet.js.org/).
- **Map Tiles:** [OpenStreetMap](https://www.openstreetmap.org/) standard tile layer (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- **Transit Hub Coordinates:** Pre-indexed regional city coordinates (`POPULAR_CITY_COORDINATES`) for Western India corridor transit centers (Ahmedabad, Surat, Vadodara, Bharuch, Anand, Rajkot, etc.).
- **Route Preview & Distance Metrics:** [Project-OSRM](https://project-osrm.org/) public routing service (`router.project-osrm.org`) for driving distance and travel duration estimation.
- **Defensive Error Handling:** `MapErrorBoundary` and in-memory request caching.

```
[ Driver Form: OfferRidePage ]
      │
      ├──> User types "Surat" ─────────> Auto-seeds Surat coordinates from POPULAR_CITY_COORDINATES
      ├──> User types "Ahmedabad" ─────> Auto-seeds Ahmedabad coordinates from POPULAR_CITY_COORDINATES
      │
      ├──> Driver drags markers ───────> Updates exact pickup/drop-off coordinates on Leaflet map
      │
      ├──> Debounced Query (350ms) ───> OSRM Public Routing API (Driving Profile)
      │                                       │
      │                                       ├── Success ──> Polyline coordinates, distance (km), duration (min)
      │                                       └── Failure ──> Best-effort null fallback (Zero user disruption)
      │
      └──> Submit API Request ─────────> POST /api/v1/rides (Stores text fields + optional coordinates & metrics)
```

---

## 2. Public Services Usage Policies & Compliance

### 2.1 OpenStreetMap Tile Usage Policy

OpenStreetMap provides free map data created by a worldwide community. All tile consumption complies with the official [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/):

1. **Attribution:** The `RouteMap` component prominently renders:
   `&copy; OpenStreetMap contributors` with a hyperlink pointing directly to `https://www.openstreetmap.org/copyright`.
2. **No Bulk Scraping:** Tiles are requested on-demand only when a user navigates to `/offer-ride` or `/rides/:id`. Landing and search listing pages do not mount map tiles.
3. **Scroll Wheel Zoom Disabled:** `scrollWheelZoom={false}` prevents accidental zoom spikes and tile request bursts while the user scrolls down long pages.
4. **Production Recommendation:** For high-volume production deployments (>100k daily active users), RideMitra will switch tile serving to an OSM-friendly CDN provider (such as Stadia Maps, Jawg, or self-hosted OpenMapTiles).

### 2.2 Project-OSRM Demo Server Policy & Limitations

RideMitra integrates with `router.project-osrm.org` adhering to the [OSRM Backend Usage Policy](https://github.com/Project-OSRM/osrm-backend/wiki/API-Usage-Policy):

1. **Demonstration & Prototyping Only:** The demo server is explicitly documented and labeled in the UI as **"Best-effort driving estimate"**.
2. **No Traffic Guarantee:** The public OSRM server calculates standard speed limits and road topology, but does **not** model live real-time congestion or Indian festival traffic.
3. **No Turn-by-Turn Navigation:** RideMitra does not run real-time GPS tracking or turn-by-turn prompts against the demo server.
4. **Client-Side In-Memory Cache:** In `apps/web/src/lib/osrm.ts`, query results are cached by coordinate pairs (`cacheKey = ${origin}->${destination}`) to prevent duplicate external HTTP queries when users switch tabs or re-render components.
5. **Request Timeout:** An `AbortController` enforces a 6-second timeout to prevent stalling the client interface on slow networks.

---

## 3. Database Schema & Migration

### 3.1 Migration 006: `database/migrations/006_add_location_coordinates_to_rides.sql`

```sql
ALTER TABLE rides
  ADD COLUMN pickup_lat DECIMAL(10, 7) NULL DEFAULT NULL AFTER dropoff_point,
  ADD COLUMN pickup_lng DECIMAL(10, 7) NULL DEFAULT NULL AFTER pickup_lat,
  ADD COLUMN dropoff_lat DECIMAL(10, 7) NULL DEFAULT NULL AFTER pickup_lng,
  ADD COLUMN dropoff_lng DECIMAL(10, 7) NULL DEFAULT NULL AFTER dropoff_lat,
  ADD COLUMN distance_km DECIMAL(6, 2) NULL DEFAULT NULL AFTER dropoff_lng,
  ADD COLUMN duration_minutes INT UNSIGNED NULL DEFAULT NULL AFTER distance_km;

ALTER TABLE rides
  ADD INDEX idx_rides_pickup_coords (pickup_lat, pickup_lng),
  ADD INDEX idx_rides_dropoff_coords (dropoff_lat, dropoff_lng);
```

### 3.2 Coordinate Precision Rationale

- **`DECIMAL(10, 7)`:** Represents geographic latitude and longitude with ~1.1 cm accuracy at the equator.
- Eliminates IEEE 754 floating-point rounding errors.
- Fully compatible with standard MySQL spatial features.

---

## 4. Graceful Degradation & Fallback Architecture

| Failure Mode | Application Behavior |
| :--- | :--- |
| **OSRM Server 503 / Offline** | `fetchOsrmRoute` catches the error and returns `null`. `RouteMetricsBadge` displays an informational notice. Ride publishing and booking proceed without error. |
| **OSRM Route Geometry Missing** | Map renders markers and a dashed direct flight corridor polyline. Distance/duration is marked unverified. |
| **Browser Canvas / Leaflet Error** | `MapErrorBoundary` intercepts rendering crashes and displays a clean fallback card (`Interactive map preview currently unavailable`). Page interaction remains 100% stable. |
| **Legacy Ride Records (Phases 1–4)** | Legacy rides have `pickup_lat = null`. Frontend automatically resolves regional corridor centroid or gracefully hides the map, displaying the original high-contrast text corridor. |
| **Missing Network / Adblocker** | Native HTML text inputs (`origin`, `destination`, `pickupPoint`, `dropoffPoint`) remain functional. Drivers can publish and passengers can book without loading external scripts. |

---

## 5. Security & Secret Management

- **Zero Client Secrets:** The Free Maps MVP uses public OpenStreetMap tiles and OSRM endpoints; no API keys or third-party credit card tokens are packaged into the frontend bundle.
- **Location Privacy:** Exact door numbers and private residential addresses are avoided in public search cards. Commuters coordinate pickup points via recognizable transit landmarks (e.g. Star Bazaar Circle, ISCON Flyover).
- **Backend Bounds Validation:** Zod schemas validate latitude `[-90, 90]`, longitude `[-180, 180]`, distance `[0, 5000 km]`, and duration `[0, 10080 min]`, enforcing that coordinate pairs must be supplied together.
