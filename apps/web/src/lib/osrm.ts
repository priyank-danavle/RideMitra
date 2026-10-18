/**
 * RideMitra — OSRM Routing Service Client
 * 
 * Public Service: Project-OSRM Demo Routing Server (Car Profile)
 * Usage Policy: Best-effort public demo service. Rate limits and uptime SLAs apply.
 * Never use for commercial high-frequency turn-by-turn navigation without self-hosting.
 * 
 * Documentation & Policy:
 * https://github.com/Project-OSRM/osrm-backend/wiki/API-Usage-Policy
 */

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface OsrmRouteResult {
  distanceKm: number;
  durationMinutes: number;
  /** Array of [lat, lng] pairs ready for Leaflet Polyline rendering */
  polylineCoordinates: [number, number][];
  isBestEffort: boolean;
}

// In-memory route cache to prevent duplicate external requests during session
const routeCache = new Map<string, OsrmRouteResult>();

/**
 * Fetches driving route, road distance, and estimated travel duration between two coordinates.
 * Returns null gracefully if the service is unreachable, times out, or fails.
 */
export async function fetchOsrmRoute(
  origin: LatLngPoint,
  destination: LatLngPoint,
): Promise<OsrmRouteResult | null> {
  // Validate coordinate sanity before querying
  if (
    isNaN(origin.lat) ||
    isNaN(origin.lng) ||
    isNaN(destination.lat) ||
    isNaN(destination.lng) ||
    origin.lat < -90 ||
    origin.lat > 90 ||
    destination.lat < -90 ||
    destination.lat > 90 ||
    origin.lng < -180 ||
    origin.lng > 180 ||
    destination.lng < -180 ||
    destination.lng > 180
  ) {
    return null;
  }

  // Cache key: rounded to 4 decimals (~11m precision)
  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    // Note: OSRM expects coordinates in {longitude},{latitude} format
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`[OSRM] Routing request returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
      console.warn('[OSRM] No route found for specified points:', data.code);
      return null;
    }

    const primaryRoute = data.routes[0];
    const distanceMeters = primaryRoute.distance || 0;
    const durationSeconds = primaryRoute.duration || 0;

    // Convert GeoJSON [lng, lat] coordinates to Leaflet [lat, lng]
    const rawCoordinates: [number, number][] = primaryRoute.geometry?.coordinates || [];
    const polylineCoordinates: [number, number][] = rawCoordinates.map(([lng, lat]) => [lat, lng]);

    const result: OsrmRouteResult = {
      distanceKm: Number((distanceMeters / 1000).toFixed(1)),
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      polylineCoordinates,
      isBestEffort: true,
    };

    routeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    // If request aborted, network disconnected, or blocked by CORS/Adblocker
    console.warn('[OSRM] Best-effort routing query skipped or unavailable:', err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
