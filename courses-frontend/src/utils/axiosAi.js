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
                // Check if we're on a shared Pro Learning route - don't redirect to auth
                const currentPath = window.location.pathname;
                const courseId = currentPath.split('/').pop();
                const courseDataKey = `course_content_${courseId}`;
                const courseData = localStorage.getItem(courseDataKey);

                const isSharedProLearning = currentPath.startsWith('/learning-path/share/') || currentPath.startsWith('/pro-learning/share/') ||
                    (currentPath.startsWith('/learning-path/') && courseData?.includes('"source":"shared-link"')) ||
                    (currentPath.startsWith('/pro-learning/') && courseData?.includes('"source":"shared-link"'));

                if (isSharedProLearning) {
                    isRefreshing = false;
                    onRefreshed(null);
                    return Promise.reject(new Error('Authentication not available for shared content'));
                }

                // No refresh token means user must login again. Preserve pending chat message if present.
                try {
                    const data = originalRequest.data;
                    let pendingMessage = '';
                    if (data && typeof data === 'string') {
                        // Attempt to parse JSON body
                        try { pendingMessage = JSON.parse(data)?.query || JSON.parse(data)?.message || ''; } catch (_) { }
                    } else if (data && typeof data === 'object') {
                        pendingMessage = data.query || data.message || '';
                    }
                    if (pendingMessage && typeof sessionStorage !== 'undefined') {
                        sessionStorage.setItem('pendingChatMessage', pendingMessage);
                        const current = new URL(window.location.href);
                        current.searchParams.set('message', pendingMessage);
                        current.searchParams.set('prefill', 'true');
                        const returnTo = `${current.pathname}?${current.searchParams.toString()}`;
                        window.location.href = `/auth?mode=login&returnTo=${encodeURIComponent(returnTo)}`;
                    }
                } catch (_) { }
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
                const st = refreshErr?.response?.status;
                if (st === 400 || st === 401 || (typeof st === 'number' && st >= 500)) {
                    storage.clearAuthTokens();
                }
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
