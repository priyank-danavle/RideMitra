import type { HealthCheckResponse, ReadinessCheckResponse, ApiResponse } from '@ridemitra/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code = 'API_ERROR', status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      const errorMsg = json.error?.message || `HTTP ${response.status}: Request failed`;
      const errorCode = json.error?.code || 'UNKNOWN_ERROR';
      throw new ApiError(errorMsg, errorCode, response.status);
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
  getHealth: () => request<HealthCheckResponse>('health'),
  getReady: () => request<ReadinessCheckResponse>('ready'),
};
