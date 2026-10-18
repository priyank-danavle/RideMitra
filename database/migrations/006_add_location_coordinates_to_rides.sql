-- Migration 006: Add optional geographic coordinates and route metrics to rides table
-- Supports Phase 5.3 Free Maps MVP (Leaflet + OpenStreetMap + OSRM) with full backward compatibility

ALTER TABLE rides
  ADD COLUMN pickup_lat DECIMAL(10, 7) NULL DEFAULT NULL AFTER dropoff_point,
  ADD COLUMN pickup_lng DECIMAL(10, 7) NULL DEFAULT NULL AFTER pickup_lat,
  ADD COLUMN dropoff_lat DECIMAL(10, 7) NULL DEFAULT NULL AFTER pickup_lng,
  ADD COLUMN dropoff_lng DECIMAL(10, 7) NULL DEFAULT NULL AFTER dropoff_lat,
  ADD COLUMN distance_km DECIMAL(6, 2) NULL DEFAULT NULL AFTER dropoff_lng,
  ADD COLUMN duration_minutes INT UNSIGNED NULL DEFAULT NULL AFTER distance_km;

-- Spatial index candidate for future bounding box queries
ALTER TABLE rides
  ADD INDEX idx_rides_pickup_coords (pickup_lat, pickup_lng),
  ADD INDEX idx_rides_dropoff_coords (dropoff_lat, dropoff_lng);
