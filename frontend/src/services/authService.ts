import api, { setStoredToken, removeStoredToken, getStoredToken } from './api';
import type { User, LoginRequest, LoginResponse, ChangePasswordRequest } from '@/types/auth';

/**
 * Authentication service - handles login, logout, and user management
 */
export const authService = {
  /**
   * Login with email and password (JSON endpoint)
   */
  async login(credentials: LoginRequest): Promise<{ token: string; user: User }> {
    const response = await api.post<LoginResponse>('/auth/login/json', credentials);
    const token = response.data.access_token;
    
    // Store token
    setStoredToken(token);
    
    // Get user data
    const user = await this.getMe();
    
    return { token, user };
  },

  /**
   * Login with email and password (OAuth2 form endpoint)
   */
  async loginForm(email: string, password: string): Promise<{ token: string; user: User }> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const token = response.data.access_token;
    setStoredToken(token);
    
    const user = await this.getMe();
    return { token, user };
  },

  /**
   * Get current authenticated user
   */
  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.post('/auth/change-password', data);
  },

  /**
   * Logout - clear stored token
   */
  logout(): void {
    removeStoredToken();
  },

  /**
   * Check if user has stored token
   */
  hasToken(): boolean {
    return !!getStoredToken();
  },

  /**
   * Verify if stored token is valid by calling /me
   */
  async verifyToken(): Promise<User | null> {
    if (!this.hasToken()) {
      return null;
    }
    
    try {
      return await this.getMe();
    } catch {
      // Token invalid, clear it
      removeStoredToken();
      return null;
    }
  },
};

export default authService;
