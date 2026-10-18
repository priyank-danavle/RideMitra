/**
 * Health check response payload returned by GET /api/v1/health
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
}

/**
 * Readiness check response payload returned by GET /api/v1/ready
 */
export interface ReadinessCheckResponse {
  status: 'ready' | 'not_ready';
  service: string;
  version: string;
  timestamp: string;
  checks: {
    system: 'ok' | 'degraded';
    database: 'connected' | 'unreachable' | 'not_configured';
  };
}

/**
 * Standard API envelope for structured responses
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Supported vehicle types for rides
 */
export type VehicleType = 'ALL' | 'CAR' | 'BIKE';

/**
 * Supported ride commute scopes
 */
export type RideType = 'CITY' | 'INTERCITY';

/**
 * Search query payload for discovering rides (Phase 1 search form contract)
 */
export interface RideSearchQuery {
  source: string;
  destination: string;
  date?: string;
  vehicleType?: VehicleType;
}
