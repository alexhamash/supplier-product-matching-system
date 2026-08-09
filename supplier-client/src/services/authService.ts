// src/services/authService.ts
//
// Authentication service for registering and logging in users.
//
// Endpoints consumed:
//   POST /api/auth/register
//   POST /api/auth/login

import { apiClient, setToken, clearToken, getToken } from './api';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── Auth Operations ────────────────────────────────────────────────────────

/**
 * Register a new user account.
 * Stores the returned JWT token in localStorage.
 */
export const register = async (payload: RegisterPayload): Promise<AuthUser> => {
  const data = await apiClient.post<AuthResponse>('auth/register', payload);
  setToken(data.token);
  return data.user;
};

/**
 * Log in an existing user.
 * Stores the returned JWT token in localStorage.
 */
export const login = async (payload: LoginPayload): Promise<AuthUser> => {
  const data = await apiClient.post<AuthResponse>('auth/login', payload);
  setToken(data.token);
  return data.user;
};

/**
 * Log out the current user by clearing the stored token.
 */
export const logout = (): void => {
  clearToken();
};

/**
 * Check whether the user is currently authenticated (has a stored token).
 */
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};
