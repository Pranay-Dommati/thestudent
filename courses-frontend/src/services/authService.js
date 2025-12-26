import logger from '../utils/logger';
import apiAxios from '../utils/axios';
import storage from '../utils/storage';
// Utility for making authenticated API requests with proper token validation

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class AuthService {
  constructor() {
    this.authData = null;
    this.loadAuthData();
  }

  loadAuthData() {
    try {
      const authData = storage.getItem('adminAuth');
      this.authData = authData ? JSON.parse(authData) : null;
    } catch (error) {
  logger.error('Error loading auth data:', error);
      this.authData = null;
    }
  }

  saveAuthData(authData) {
    this.authData = authData;
    storage.setItem('adminAuth', JSON.stringify(authData));
  }

  clearAuthData() {
    this.authData = null;
    storage.removeItem('adminAuth');
  }

  getAccessToken() {
    if (!this.authData || !this.authData.tokens) {
      return null;
    }
    return this.authData.tokens.access;
  }

  getRefreshToken() {
    if (!this.authData || !this.authData.tokens) {
      return null;
    }
    return this.authData.tokens.refresh;
  }

  isAuthenticated() {
    if (!this.authData || !this.authData.isAuthenticated) {
      return false;
    }

    // Check if user is superuser
    if (!this.authData.user || !this.authData.user.is_superuser) {
      return false;
    }

    // Check session timeout (24 hours)
    const currentTime = new Date().getTime();
    const authTime = this.authData.timestamp;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (currentTime - authTime > TWENTY_FOUR_HOURS) {
      this.clearAuthData();
      return false;
    }

    return true;
  }

  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Call refresh endpoint using axios; interceptors may attach Authorization header, which backend should ignore here.
      const { data } = await apiAxios.post(`/auth/token/refresh/`, { refresh: refreshToken });
      
      // Update the access token
      this.authData.tokens.access = data.access;
      this.saveAuthData(this.authData);
      // Persist common keys used by axios interceptors
      try {
        if (data.access) storage.setItem('accessToken', data.access);
        if (data.access) storage.setItem('access_token', data.access);
      } catch {}
      
      return data.access;
    } catch (error) {
  logger.error('Token refresh error:', error);
      this.clearAuthData();
      throw error;
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    // Prefer centralized axios instance which handles Authorization + refresh
    try {
      const method = (options.method || 'GET').toLowerCase();
      const data = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined;
      const headers = options.headers || {};
      const config = { url, method, headers };
      if (data !== undefined) config.data = data;
      const response = await apiAxios.request(config);
      return response;
    } catch (error) {
      logger.error('Authenticated request error:', error);
      throw error;
    }
  }

  async verifyAdminAccess() {
    try {
      const { data } = await apiAxios.get(`/auth/verify-admin/`);
      
      // Update user data if verification is successful
      if (data.valid && data.user) {
        this.authData.user = data.user;
        this.saveAuthData(this.authData);
      }

      return data;
    } catch (error) {
  logger.error('Admin verification error:', error);
      this.clearAuthData();
      throw error;
    }
  }

  async adminLogin(email, password) {
    try {
      const { data } = await apiAxios.post(`/auth/admin-login/`, { email, password });

      // Save authentication data
      const authData = {
        isAuthenticated: true,
        user: data.user,
        tokens: data.tokens,
        timestamp: new Date().getTime(),
      };

      this.saveAuthData(authData);

      // Also persist tokens to common keys used by axios interceptors and other services
      try {
        if (data.tokens?.access) storage.setItem('accessToken', data.tokens.access);
        if (data.tokens?.refresh) storage.setItem('refreshToken', data.tokens.refresh);
        // Backwards-compat common keys some code may read
        if (data.tokens?.access) storage.setItem('access_token', data.tokens.access);
      } catch {}
      return data;
    } catch (error) {
  logger.error('Admin login error:', error);
      throw error;
    }
  }

  async fetchAdminUsers(params = {}) {
    const { data } = await apiAxios.get(`/auth/users/`, { params });
    return data;
  }

  async adminSetUserPassword(userId, newPassword) {
    try {
      const { data } = await apiAxios.post(`/auth/users/${userId}/set-password/`, { new_password: newPassword });
      return data || {};
    } catch (error) {
      let message = 'Failed to update password';
      const status = error?.response?.status;
      const respData = error?.response?.data;
      if (respData?.error) message = respData.error;
      else if (typeof respData === 'string') message = respData.slice(0, 200);
      if (status) message = `${message} (HTTP ${status})`;
      throw new Error(message);
    }
  }

  logout() {
    this.clearAuthData();
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
