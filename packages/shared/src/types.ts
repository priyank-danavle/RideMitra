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
 * Supported vehicle filter types for rides
 */
export type VehicleType = 'ALL' | 'CAR' | 'BIKE';

/**
 * Concrete vehicle types for registered vehicles
 */
export type SpecificVehicleType = 'CAR' | 'BIKE';

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

/**
 * User roles
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * Public/Safe user profile returned across the API and frontend
 * Note: Never contains passwordHash or internal security tokens
 */
export interface UserSafeProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication response payload for login & registration
 */
export interface AuthResponse {
  user: UserSafeProfile;
  token?: string; // Present when Bearer header is preferred over cookies
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Profile update request payload (restricted to safe editable fields)
 */
export interface UpdateProfileRequest {
  name?: string;
  phone?: string | null;
  bio?: string | null;
}

/**
 * Registered vehicle entity
 */
export interface Vehicle {
  id: string;
  userId: string;
  type: SpecificVehicleType;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  capacity: number;
  isVerified: boolean; // Explicit: defaults to false (not automatically treated as government verified)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload to create a new vehicle
 */
export interface CreateVehicleRequest {
  type: SpecificVehicleType;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  capacity: number;
}

/**
 * Request payload to update an existing vehicle
 */
export interface UpdateVehicleRequest {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  capacity?: number;
}
