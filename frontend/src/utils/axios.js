import axios from 'axios';
import storage from './storage';

const instance = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || '/api'),
  timeout: 15000, // 15 second timeout - fail fast to prevent user frustration
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
instance.interceptors.request.use(
  async (config) => {
    // Prefer the freshest token from localStorage only.
    let token = storage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;

// --- Response interceptor: auto-refresh access token on 401 and retry once ---
let isRefreshing = false;
let refreshPromise = null;
const subscribers = [];

function onRefreshed(newToken) {
  subscribers.forEach((cb) => cb(newToken));
  subscribers.length = 0;
}

function addSubscriber(callback) {
  subscribers.push(callback);
}

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    // Only handle 401 for requests that haven't been retried yet
    if (status === 401 && !originalRequest._retry) {
      // Don't try refresh on auth endpoints themselves
      const url = originalRequest.url || '';
      const isAuthEndpoint = /\/auth\/(login|register|token\/refresh|google)/.test(url);
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addSubscriber((newToken) => {
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(instance(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
  const refreshToken = storage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        onRefreshed(null);
        return Promise.reject(error);
      }

      try {
        // Use base axios without interceptors
        const refreshUrl = `${instance.defaults.baseURL}/auth/token/refresh/`;
        refreshPromise = axios.post(refreshUrl, { refresh: refreshToken }, {
          headers: { 'Content-Type': 'application/json' },
        });
        const { data } = await refreshPromise;
        const newAccess = data?.access;
        if (!newAccess) throw new Error('No access token in refresh response');

  // Persist new token
        storage.setItem('accessToken', newAccess);

        // Notify queued subscribers
        onRefreshed(newAccess);

        // Retry original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        return instance(originalRequest);
      } catch (refreshErr) {
  // Cleanup tokens on hard failure
        storage.clearAuthTokens();
        onRefreshed(null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);