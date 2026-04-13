import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      timeout: Number(API_TIMEOUT),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add token to requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && this.refreshToken && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshAccessToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Load tokens from localStorage
    this.loadTokens();
  }

  private loadTokens() {
    const tokens = localStorage.getItem('auth_tokens');
    if (tokens) {
      const { access, refresh } = JSON.parse(tokens);
      this.accessToken = access;
      this.refreshToken = refresh;
    }
  }

  private getAccessToken(): string | null {
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/auth/token/refresh/`,
        { refresh: this.refreshToken },
        { timeout: Number(API_TIMEOUT) }
      );

      const { access } = response.data;
      this.accessToken = access;

      // Update localStorage
      const tokens = localStorage.getItem('auth_tokens');
      if (tokens) {
        const parsed = JSON.parse(tokens);
        localStorage.setItem(
          'auth_tokens',
          JSON.stringify({ ...parsed, access })
        );
      }
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem(
      'auth_tokens',
      JSON.stringify({ access, refresh })
    );
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('user');
  }

  getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();
