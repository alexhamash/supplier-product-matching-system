// src/services/api.ts
//
// Centralized API client for communicating with the Supplier REST API.
//
// The base URL is resolved from `process.env.VITE_API_URL` (with a fallback to
// Vite's `import.meta.env.VITE_API_URL` for tooling that injects env vars at
// build time). If neither is set, it defaults to `http://localhost:3001/api`,
// matching the Express backend's default port (see supplier-backend/src/server.ts).

// ─── Environment typing ──────────────────────────────────────────────────────
// The client project does not include `@types/node`, so declare a minimal
// `process.env` shape to support `process.env.VITE_API_URL` without pulling in
// the full Node type definitions.

declare const process: {
  env: {
    VITE_API_URL?: string;
    [key: string]: string | undefined;
  };
};

// ─── Base URL ────────────────────────────────────────────────────────────────

/**
 * Resolve the API base URL.
 *
 * Priority:
 *   1. `process.env.VITE_API_URL` (Node-style env, per project convention)
 *   2. `import.meta.env.VITE_API_URL` (Vite-injected env)
 *   3. `http://localhost:3001/api` (default)
 */
const resolveBaseUrl = (): string => {
  const nodeEnv =
    typeof process !== 'undefined' && process.env?.VITE_API_URL
      ? process.env.VITE_API_URL
      : undefined;

  const viteEnv =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
      ? import.meta.env.VITE_API_URL
      : undefined;

  return nodeEnv || viteEnv || 'http://localhost:3001/api';
};

export const BASE_URL: string = resolveBaseUrl();

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  total?: number;
}

export interface ApiError {
  success: false;
  message: string;
  timestamp?: string;
}

// ─── Token Management ───────────────────────────────────────────────────────

const TOKEN_KEY = 'token';

/**
 * Store the JWT token in localStorage.
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Retrieve the JWT token from localStorage (or null if absent).
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Clear the JWT token from localStorage (logout).
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build the headers for an outgoing request.
 *
 * The token is read from localStorage on EVERY request, right before the
 * request is sent, so a freshly stored token is always used and stale tokens
 * are never cached in memory.
 *
 * Automatically attaches the `Authorization: Bearer <token>` header when a
 * token exists in localStorage.
 */
const buildHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Build a full URL from a path segment.
 * Ensures there is exactly one slash between BASE_URL and path.
 */
const buildUrl = (path: string): string => {
  const base = BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
};

/**
 * Handle an unauthorized (401) response.
 *
 * Clears the stored token and redirects to the login page so the user is
 * forced to start a fresh authentication session instead of failing silently
 * on subsequent requests.
 */
const handleUnauthorized = (): void => {
  localStorage.removeItem('token');
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * Parse the JSON response body.
 * If the response is not OK, throw an error with the server message.
 *
 * A 401 (Unauthorized) response additionally clears the stored token and
 * redirects to the login page.
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  // Unauthorized → clear token and force a fresh login session.
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized. Please log in again.');
  }

  const body = await response.json() as ApiResponse<T> | ApiError;

  if (!response.ok || !body.success) {
    const message =
      (body as ApiError).message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return (body as ApiResponse<T>).data;
};

// ─── Centralized API Client ─────────────────────────────────────────────────

/**
 * A single, reusable API client instance exposing typed HTTP helpers.
 *
 * All methods resolve paths relative to `BASE_URL` and return the unwrapped
 * `data` payload from the backend's `{ success, data, ... }` envelope.
 */
export const apiClient = {
  /**
   * GET request.
   *
   * @param path - API path relative to the base URL (e.g. "main-products").
   * @param params - Optional query parameters as a record.
   */
  get: async <T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> => {
    const url = new URL(buildUrl(path));

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: buildHeaders(),
    });

    return handleResponse<T>(response);
  },

  /**
   * POST request.
   *
   * @param path - API path relative to the base URL.
   * @param body - Optional request payload.
   */
  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * PUT request.
   *
   * @param path - API path relative to the base URL.
   * @param body - Optional request payload.
   */
  put: async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await fetch(buildUrl(path), {
      method: 'PUT',
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * PATCH request.
   *
   * @param path - API path relative to the base URL.
   * @param body - Optional request payload.
   */
  patch: async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await fetch(buildUrl(path), {
      method: 'PATCH',
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * DELETE request.
   *
   * @param path - API path relative to the base URL.
   */
  del: async <T = void>(path: string): Promise<T> => {
    const response = await fetch(buildUrl(path), {
      method: 'DELETE',
      headers: buildHeaders(),
    });

    return handleResponse<T>(response);
  },
};

// ─── Backward-compatible named exports ──────────────────────────────────────
// Kept so existing callers that import `{ get, post, put, patch, del }`
// continue to work without modification.

export const get = apiClient.get;
export const post = apiClient.post;
export const put = apiClient.put;
export const patch = apiClient.patch;
export const del = apiClient.del;
