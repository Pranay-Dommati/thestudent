import baseAxios from 'axios';
import apiAxios from './axios';
import storage from './storage';

// Reuse the same interceptors logic by creating a new axios instance
// with baseURL '/ai' and attaching the same request/response interceptors
// Note: We import the configured apiAxios to reference its interceptors,
// but we create a separate instance to avoid mixing baseURLs.

const axiosAi = baseAxios.create({
  baseURL: (import.meta.env.VITE_AI_BASE_URL || '/ai'),
  headers: { 'Content-Type': 'application/json' },
});

// Copy request interceptor: attach Authorization header from localStorage
axiosAi.interceptors.request.use(
  async (config) => {
    const token = storage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
const subscribers = [];
function onRefreshed(newToken) {
  subscribers.forEach((cb) => cb(newToken));
  subscribers.length = 0;
}
function addSubscriber(callback) { subscribers.push(callback); }

axiosAi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    if (status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
      const isAuthEndpoint = /\/auth\/(login|register|token\/refresh|google)/.test(url);
      if (isAuthEndpoint) return Promise.reject(error);

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addSubscriber((newToken) => {
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(axiosAi(originalRequest));
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
        const refreshUrl = `${apiAxios.defaults.baseURL}/auth/token/refresh/`;
        const { data } = await baseAxios.post(refreshUrl, { refresh: refreshToken }, {
          headers: { 'Content-Type': 'application/json' },
        });
        const newAccess = data?.access;
        if (!newAccess) throw new Error('No access token in refresh response');
        storage.setItem('accessToken', newAccess);
        onRefreshed(newAccess);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        return axiosAi(originalRequest);
      } catch (refreshErr) {
        storage.clearAuthTokens();
        onRefreshed(null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosAi;
