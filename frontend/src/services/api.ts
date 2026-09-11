import type { LoginResponse, User } from '../types';

const API_BASE_URL = 'http://localhost:5000';

const getStoredToken = (): string | null => localStorage.getItem('opsflow_token');

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || 'Login failed. Please try again.');
    }

    return data as LoginResponse;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to reach the OpsFlow backend at http://localhost:5000. Please make sure the backend server is running.');
    }

    throw error;
  }
};

export const authenticatedApi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getStoredToken();

  if (!token) {
    throw new Error('Your session has expired. Please log in again.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || 'Request failed. Please try again.');
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to reach the OpsFlow backend. Check that the backend is running at http://localhost:5000 and CORS is enabled for the frontend origin.');
    }

    throw error;
  }
};

export const getStoredUser = (): User | null => {
  const rawUser = localStorage.getItem('opsflow_user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
};
