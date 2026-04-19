import { apiClient } from './api';
import { LoginCredentials, AuthResponse, RegisterCredentials, RegisterResponse, User } from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.getClient().post('/accounts/login/', credentials);
      const { access, refresh, user } = response.data;
      apiClient.setTokens(access, refresh);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    try {
      const response = await apiClient.getClient().post('/organizations/company-signup/', credentials);
      // API returns { message: "Organization created successfully" } — no tokens.
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.getClient().post('/accounts/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.logout();
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.getClient().get('/accounts/me/');
    return response.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.getClient().post('/accounts/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.getClient().post('/accounts/password-reset/request/', { email });
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await apiClient.getClient().post('/accounts/password-reset/confirm/', {
      token,
      new_password: newPassword,
    });
  },

  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_tokens');
  },
};