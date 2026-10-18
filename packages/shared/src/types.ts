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

/**
 * Ride operational lifecycle status
 */
export type RideStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

/**
 * Non-sensitive public profile of driver attached to published rides
 */
export interface DriverPublicProfile {
  id: string;
  name: string;
  bio: string | null;
  isVerified: boolean;
  createdAt: string;
}

/**
 * Non-sensitive vehicle summary attached to published rides
 */
export interface RideVehicleSummary {
  id: string;
  type: SpecificVehicleType;
  make: string;
  model: string;
  year: number;
  color: string;
  capacity: number;
  registrationNumber?: string;
}

/**
 * Core Ride entity representing a published carpool or bikepool journey
 */
export interface Ride {
  id: string;
  driverId: string;
  vehicleId: string;
  type: RideType; // 'CITY' | 'INTERCITY'
  origin: string;
  destination: string;
  pickupPoint: string | null;
  dropoffPoint: string | null;
  departureTime: string; // ISO 8601 string
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number; // in INR
  description: string | null;
  status: RideStatus;
  createdAt: string;
  updatedAt: string;
  driver?: DriverPublicProfile;
  vehicle?: RideVehicleSummary;
}

/**
 * Request payload to publish/offer a new ride
 */
export interface CreateRideRequest {
  vehicleId: string;
  type: RideType;
  origin: string;
  destination: string;
  pickupPoint?: string | null;
  dropoffPoint?: string | null;
  departureTime: string;
  availableSeats: number;
  pricePerSeat?: number;
  description?: string | null;
}

/**
 * Request payload to update an eligible scheduled ride
 */
export interface UpdateRideRequest {
  pickupPoint?: string | null;
  dropoffPoint?: string | null;
  departureTime?: string;
  availableSeats?: number;
  pricePerSeat?: number;
  description?: string | null;
}

/**
 * Filter and search parameters for ride discovery
 */
export interface RideSearchParams {
  origin?: string;
  destination?: string;
  date?: string; // YYYY-MM-DD
  type?: RideType;
  vehicleType?: SpecificVehicleType | 'ALL';
  minPrice?: number;
  maxPrice?: number;
  minSeats?: number;
  sortBy?: 'departureTime' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Generic paginated response envelope
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Booking lifecycle status
 */
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

/**
 * Non-sensitive public profile of a passenger attached to a booking
 */
export interface BookingPassengerSummary {
  id: string;
  name: string;
  bio: string | null;
  isVerified: boolean;
  createdAt: string;
}

/**
 * Summary of ride attached to a passenger's booking record
 */
export interface BookingRideSummary {
  id: string;
  driverId: string;
  origin: string;
  destination: string;
  pickupPoint: string | null;
  dropoffPoint: string | null;
  departureTime: string;
  type: RideType;
  status: RideStatus;
  pricePerSeat: number;
  availableSeats: number;
  totalSeats: number;
  driver?: DriverPublicProfile;
  vehicle?: RideVehicleSummary;
}

/**
 * Core Booking entity representing a seat reservation
 */
export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  pricePerSeat: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  passenger?: BookingPassengerSummary;
  ride?: BookingRideSummary;
}

/**
 * Request payload to create a new booking request
 */
export interface CreateBookingRequest {
  rideId: string;
  seatsBooked: number;
}

/**
 * Response when retrieving passenger or driver bookings
 */
export interface BookingsResponse {
  bookings: Booking[];
}
