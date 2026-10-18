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
};
