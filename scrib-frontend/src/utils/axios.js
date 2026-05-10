import axios from 'axios'
import storage from './storage'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '120000', 10),
  headers: {
    'Content-Type': 'application/json',
  },
})

instance.interceptors.request.use(
  async (config) => {
    const url = String(config.url || '')
    const isRefreshEndpoint = /\/auth\/token\/refresh\/?$/i.test(url)
    if (!isRefreshEndpoint) {
      const token = storage.getItem('accessToken')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

let isRefreshing = false
const subscribers = []

function onRefreshed(newToken) {
  subscribers.forEach((cb) => cb(newToken))
  subscribers.length = 0
}

function addSubscriber(callback) {
  subscribers.push(callback)
}

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    const status = error.response?.status

    if (status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || ''
      const isAuthEndpoint = /\/auth\/(login|register|token\/refresh|google)/.test(url)
      if (isAuthEndpoint) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addSubscriber((newToken) => {
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`
              resolve(instance(originalRequest))
            } else {
              reject(error)
            }
          })
        })
      }

      isRefreshing = true
      const refreshToken = storage.getItem('refreshToken')
      if (!refreshToken) {
        isRefreshing = false
        onRefreshed(null)
        return Promise.reject(error)
      }

      try {
        const refreshUrl = `${instance.defaults.baseURL}/auth/token/refresh/`
        const { data } = await axios.post(refreshUrl, { refresh: refreshToken }, {
          headers: { 'Content-Type': 'application/json' },
        })
        const newAccess = data?.access
        if (!newAccess) throw new Error('No access token in refresh response')
        storage.setItem('accessToken', newAccess)
        onRefreshed(newAccess)
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`
        return instance(originalRequest)
      } catch (refreshErr) {
        const st = refreshErr?.response?.status
        if (st === 400 || st === 401 || (typeof st === 'number' && st >= 500)) {
          storage.clearAuthTokens()
        }
        onRefreshed(null)
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default instance
