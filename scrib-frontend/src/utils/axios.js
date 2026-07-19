import axios from 'axios'
import storage from './storage'
import customToast from './customToast'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '120000', 10),
  headers: {
    'Content-Type': 'application/json',
  },
})

instance.interceptors.request.use(
  async (config) => {
    // Prevent API calls from hanging the react-snap prerender
    if (typeof window !== 'undefined' && window.navigator.userAgent.includes('ReactSnap')) {
      return Promise.reject(new Error('API calls disabled during prerendering'))
    }

    const url = String(config.url || '')
    const isRefreshEndpoint = /\/auth\/token\/refresh\/?$/i.test(url)
    if (!isRefreshEndpoint) {
      const token = storage.getItem('accessToken')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    
    // Start slow network timer — all requests share one global toast to prevent duplicates
    config.metadata = config.metadata || {}
    config.metadata.slowWarningTimeout = setTimeout(() => {
      showSlowToast()
      config.metadata.slowShown = true
    }, 7000)

    return config
  },
  (error) => Promise.reject(error),
)

let isRefreshing = false
const subscribers = []

// Single shared slow-network toast — avoids duplicate toasts when multiple
// concurrent requests are all slow at the same time.
const SLOW_TOAST_ID = 'global-slow-connection'
let slowRequestCount = 0

function showSlowToast() {
  slowRequestCount++
  if (slowRequestCount === 1) {
    customToast.info('Still working... Your connection seems slow.', { id: SLOW_TOAST_ID, duration: Infinity })
  }
}

function clearSlowToast() {
  if (slowRequestCount > 0) slowRequestCount--
  if (slowRequestCount === 0) {
    customToast.dismiss(SLOW_TOAST_ID)
  }
}

function onRefreshed(newToken) {
  subscribers.forEach((cb) => cb(newToken))
  subscribers.length = 0
}

function addSubscriber(callback) {
  subscribers.push(callback)
}

instance.interceptors.response.use(
  (response) => {
    const config = response.config || {}
    if (config.metadata?.slowWarningTimeout) {
      clearTimeout(config.metadata.slowWarningTimeout)
    }
    if (config.metadata?.slowShown) {
      clearSlowToast()
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config || {}
    
    if (originalRequest.metadata?.slowWarningTimeout) {
      clearTimeout(originalRequest.metadata.slowWarningTimeout)
    }
    if (originalRequest.metadata?.slowShown) {
      clearSlowToast()
    }

    const isNetworkError = error.code === 'ECONNABORTED' || !error.response || error.message === 'Network Error'
    if (isNetworkError) {
      Object.defineProperty(error, "isNetworkError", {
        value: true,
        enumerable: false,
      })
    }

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
