import logger from '../utils/logger';
// Utility for making authenticated API requests with proper token validation

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class AuthService {
  constructor() {
    this.authData = null;
    this.loadAuthData();
  }

  loadAuthData() {
    try {
      const authData = localStorage.getItem('adminAuth');
      this.authData = authData ? JSON.parse(authData) : null;
    } catch (error) {
  logger.error('Error loading auth data:', error);
      this.authData = null;
    }
  }

  saveAuthData(authData) {
    this.authData = authData;
    localStorage.setItem('adminAuth', JSON.stringify(authData));
  }

  clearAuthData() {
    this.authData = null;
    localStorage.removeItem('adminAuth');
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
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Update the access token
      this.authData.tokens.access = data.access;
      this.saveAuthData(this.authData);
      
      return data.access;
    } catch (error) {
  logger.error('Token refresh error:', error);
      this.clearAuthData();
      throw error;
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    let accessToken = this.getAccessToken();
    
    const makeRequest = async (token) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return response;
    };

    try {
      let response = await makeRequest(accessToken);

      // If token is expired, try to refresh it
      if (response.status === 401) {
        try {
          accessToken = await this.refreshAccessToken();
          response = await makeRequest(accessToken);
        } catch (refreshError) {
          this.clearAuthData();
          throw new Error('Authentication failed');
        }
      }

      return response;
    } catch (error) {
  logger.error('Authenticated request error:', error);
      throw error;
    }
  }

  async verifyAdminAccess() {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${API_BASE_URL}/auth/verify-admin/`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Admin verification failed');
      }

      const data = await response.json();
      
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
      const response = await fetch(`${API_BASE_URL}/auth/admin-login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

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
        if (typeof localStorage !== 'undefined') {
          if (data.tokens?.access) localStorage.setItem('accessToken', data.tokens.access);
          if (data.tokens?.refresh) localStorage.setItem('refreshToken', data.tokens.refresh);
          // Backwards-compat common keys some code may read
          if (data.tokens?.access) localStorage.setItem('access_token', data.tokens.access);
        }
      } catch {}
      return data;
    } catch (error) {
  logger.error('Admin login error:', error);
      throw error;
    }
  }

  async fetchAdminUsers(params = {}) {
    const API = `${API_BASE_URL}/auth/users/`;
    const search = new URLSearchParams(params).toString();
    const url = search ? `${API}?${search}` : API;
    const response = await this.makeAuthenticatedRequest(url);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch users');
    }
    return response.json();
  }

  async adminSetUserPassword(userId, newPassword) {
    const url = `${API_BASE_URL}/auth/users/${userId}/set-password/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });

    if (!response.ok) {
      let message = 'Failed to update password';
      try {
        const data = await response.json();
        message = data.error || message;
      } catch {
        try {
          const text = await response.text();
          if (text) message = text.slice(0, 200);
        } catch {}
      }
      // Add status context
      message = `${message} (HTTP ${response.status})`;
      throw new Error(message);
    }

    return response.json().catch(() => ({}));
  }

  logout() {
    this.clearAuthData();
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
