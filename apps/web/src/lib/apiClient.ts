import type {
  HealthCheckResponse,
  ReadinessCheckResponse,
  ApiResponse,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  UserSafeProfile,
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
} from '@ridemitra/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TOKEN_KEY = 'ridemitra_auth_token';

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string | null): void => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Ignore in environments without localStorage
    }
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      credentials: 'include', // Ensures HTTP-only cookies are sent/received
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      const errorMsg = json.error?.message || `HTTP ${response.status}: Request failed`;
      const errorCode = json.error?.code || 'UNKNOWN_ERROR';
      throw new ApiError(errorMsg, errorCode, response.status, json.error?.details);
    }

    if (json.data === undefined) {
      throw new ApiError(
        'Malformed API response: missing data field',
        'INVALID_RESPONSE',
        response.status,
      );
    }

    return json.data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network error or backend unreachable';
    throw new ApiError(message, 'NETWORK_ERROR', 0);
  }
}

export const apiClient = {
  // Health & System
  getHealth: () => request<HealthCheckResponse>('health'),
  getReady: () => request<ReadinessCheckResponse>('ready'),

  // Authentication
  register: async (data: RegisterRequest) => {
    const res = await request<AuthResponse>('auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },

  login: async (data: LoginRequest) => {
    const res = await request<AuthResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      tokenStorage.set(res.token);
    }
    return res;
  },

  logout: async () => {
    try {
      const res = await request<{ message: string }>('auth/logout', {
        method: 'POST',
      });
      return res;
    } finally {
      tokenStorage.set(null);
    }
  },

  getMe: () => request<{ user: UserSafeProfile }>('auth/me'),

  // User Profile
  getProfile: () => request<{ user: UserSafeProfile }>('users/profile'),
  updateProfile: (data: UpdateProfileRequest) =>
    request<{ user: UserSafeProfile }>('users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Vehicle Management
  getVehicles: () => request<{ vehicles: Vehicle[] }>('vehicles'),
  getVehicle: (id: string) => request<{ vehicle: Vehicle }>(`vehicles/${id}`),
  createVehicle: (data: CreateVehicleRequest) =>
    request<{ vehicle: Vehicle }>('vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateVehicle: (id: string, data: UpdateVehicleRequest) =>
    request<{ vehicle: Vehicle }>(`vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteVehicle: (id: string) =>
    request<{ message: string }>(`vehicles/${id}`, {
      method: 'DELETE',
    }),

  // Ride Management & Search (Phase 3)
  searchRides: (params: import('@ridemitra/shared').RideSearchParams) => {
    const query = new URLSearchParams();
    if (params.origin) query.set('origin', params.origin);
    if (params.destination) query.set('destination', params.destination);
    if (params.date) query.set('date', params.date);
    if (params.type) query.set('type', params.type);
    if (params.vehicleType && params.vehicleType !== 'ALL')
      query.set('vehicleType', params.vehicleType);
    if (params.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
    if (params.minSeats !== undefined) query.set('minSeats', String(params.minSeats));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    return request<import('@ridemitra/shared').PaginatedResponse<import('@ridemitra/shared').Ride>>(
      `rides${queryString ? `?${queryString}` : ''}`,
    );
  },

  getRideById: (id: string) => request<{ ride: import('@ridemitra/shared').Ride }>(`rides/${id}`),

  createRide: (data: import('@ridemitra/shared').CreateRideRequest) =>
    request<{ ride: import('@ridemitra/shared').Ride; message?: string }>('rides', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRide: (id: string, data: import('@ridemitra/shared').UpdateRideRequest) =>
    request<{ ride: import('@ridemitra/shared').Ride; message?: string }>(`rides/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  cancelRide: (id: string) =>
    request<{ message: string }>(`rides/${id}/cancel`, {
      method: 'POST',
    }),

  getMyRides: (status?: import('@ridemitra/shared').RideStatus | 'ALL') => {
    const query = status && status !== 'ALL' ? `?status=${status}` : '';
    return request<{ rides: import('@ridemitra/shared').Ride[] }>(`rides/my-rides${query}`);
  },

  // Booking Engine (Phase 4)
  createBooking: (data: import('@ridemitra/shared').CreateBookingRequest) =>
    request<{ booking: import('@ridemitra/shared').Booking; message: string }>('bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPassengerBookings: (status?: import('@ridemitra/shared').BookingStatus) => {
    const query = status ? `?status=${status}` : '';
    return request<{ bookings: import('@ridemitra/shared').Booking[] }>(
      `bookings/passenger/mine${query}`,
    );
  },

  getDriverBookings: (params?: {
    rideId?: string;
    status?: import('@ridemitra/shared').BookingStatus;
  }) => {
    const query = new URLSearchParams();
    if (params?.rideId) query.set('rideId', params.rideId);
    if (params?.status) query.set('status', params.status);
    const queryString = query.toString();
    return request<{ bookings: import('@ridemitra/shared').Booking[] }>(
      `bookings/driver/mine${queryString ? `?${queryString}` : ''}`,
    );
  },

  getRideBookings: (rideId: string) =>
    request<{ bookings: import('@ridemitra/shared').Booking[] }>(`bookings/ride/${rideId}`),

  getBookingById: (id: string) =>
    request<{ booking: import('@ridemitra/shared').Booking }>(`bookings/${id}`),

  confirmBooking: (id: string) =>
    request<{ booking: import('@ridemitra/shared').Booking; message: string }>(
      `bookings/${id}/confirm`,
      {
        method: 'POST',
      },
    ),

  rejectBooking: (id: string) =>
    request<{ booking: import('@ridemitra/shared').Booking; message: string }>(
      `bookings/${id}/reject`,
      {
        method: 'POST',
      },
    ),

  cancelBooking: (id: string) =>
    request<{ booking: import('@ridemitra/shared').Booking; message: string }>(
      `bookings/${id}/cancel`,
      {
        method: 'POST',
      },
    ),
};
