import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import axiosInstance from '../utils/axios'
import customToast from '../utils/customToast'
import storage from '../utils/storage'
import posthog from 'posthog-js'

const AuthContext = createContext(null)
const IS_DEV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV

const TOKEN_REFRESH_INTERVAL = 1000 * 60 * 4

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [lastChecked, setLastChecked] = useState(0)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const isValidatingRef = useRef(false)
  const validationPromiseRef = useRef(null)
  const lastValidationTimeRef = useRef(0)

  const handleAuthFailure = () => {
    storage.clearAuthTokens()
    setUser(null)
    setIsLoggedIn(false)
    setLastChecked(0)
  }

  const refreshAccessToken = async () => {
    try {
      const refreshToken = storage.getItem('refreshToken')
      if (!refreshToken) {
        if (IS_DEV) console.error('No refresh token found')
        handleAuthFailure()
        throw new Error('No refresh token')
      }

      const refreshUrl = `${axiosInstance.defaults.baseURL}/auth/token/refresh/`
      const response = await axios.post(
        refreshUrl,
        { refresh: refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      )

      if (response.data.access) {
        storage.setItem('accessToken', response.data.access)
        if (response.data.refresh) {
          storage.setItem('refreshToken', response.data.refresh)
        }
        return true
      }
      return false
    } catch (error) {
      if (IS_DEV) console.error('Token refresh failed:', error)
      const status = error.response?.status
      if (status === 400 || status === 401 || (typeof status === 'number' && status >= 500)) {
        handleAuthFailure()
      }
      throw error
    }
  }

  const validateAuth = useCallback(() => {
    const now = Date.now()
    
    // If we're already validating, return the existing promise to prevent race conditions
    // where a second call returns immediately and triggers setLoading(false) prematurely.
    if (validationPromiseRef.current) {
      return validationPromiseRef.current
    }
    
    if (now - lastValidationTimeRef.current < 2000) {
      return Promise.resolve(isLoggedIn)
    }

    const token = storage.getItem('accessToken')
    const refreshToken = storage.getItem('refreshToken')

    if (now - lastChecked < 60000 && isLoggedIn) {
      return Promise.resolve(true)
    }

    if (!token || !refreshToken) {
      handleAuthFailure()
      return Promise.resolve(false)
    }

    isValidatingRef.current = true
    lastValidationTimeRef.current = now

    const doValidation = async () => {
      try {
        try {
          const profileUrl = `${axiosInstance.defaults.baseURL}/auth/profile/`
          const response = await axios.get(profileUrl, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
          setUser(response.data)
          setIsLoggedIn(true)
          setLastChecked(now)
          return true
        } catch (error) {
          if (error.response?.status === 401) {
            await refreshAccessToken()
            const newToken = storage.getItem('accessToken')
            const profileUrl = `${axiosInstance.defaults.baseURL}/auth/profile/`
            const retryResponse = await axios.get(profileUrl, {
              headers: { 'Authorization': `Bearer ${newToken}` },
            })
            setUser(retryResponse.data)
            setIsLoggedIn(true)
            setLastChecked(now)
            return true
          }
          throw error
        }
      } catch (error) {
        if (IS_DEV) console.error('Auth validation failed:', error)
        
        // Prevent hydration mismatch: If react-snap blocks the API, we are definitely not logged in on the server.
        if (error.message === 'API calls disabled during prerendering') {
          handleAuthFailure()
          return false
        }

        const status = error.response?.status
        if (status === 401) {
          handleAuthFailure()
          return false
        }
        setIsLoggedIn(true)
        setLastChecked(now)
        return true
      } finally {
        isValidatingRef.current = false
        validationPromiseRef.current = null
      }
    }

    validationPromiseRef.current = doValidation()
    return validationPromiseRef.current
  }, [isLoggedIn, lastChecked])

  useEffect(() => {
    validateAuth().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(refreshAccessToken, TOKEN_REFRESH_INTERVAL)
      
      // Record product usage once per session
      if (!sessionStorage.getItem('productRecorded')) {
        axiosInstance.post('/auth/record-product/', { product: 'scrib' })
          .then(() => sessionStorage.setItem('productRecorded', 'true'))
          .catch(() => {})
      }
      
      return () => clearInterval(interval)
    }
  }, [isLoggedIn])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateAuth()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', validateAuth)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', validateAuth)
    }
  }, [validateAuth])

  const register = async (registrationData) => {
    try {
      const dataWithSource = { ...registrationData, signup_source: 'scrib' }
      const response = await axiosInstance.post('/auth/register/', dataWithSource)
      const { user: createdUser, tokens } = response.data

      storage.setItem('accessToken', tokens.access)
      storage.setItem('refreshToken', tokens.refresh)

      setUser(createdUser)
      setIsLoggedIn(true)
      setLastChecked(Date.now())

      customToast.success('Account created successfully!')
      return true
    } catch (error) {
      if (IS_DEV) console.error('Registration error:', error.response?.data)
      const errorData = error.response?.data
      if (errorData) {
        if (errorData.password) {
          customToast.error(errorData.password[0])
        } else if (errorData.email) {
          customToast.error(errorData.email[0])
        } else if (errorData.full_name) {
          customToast.error(errorData.full_name[0])
        } else if (errorData.non_field_errors) {
          customToast.error(errorData.non_field_errors[0])
        } else {
          customToast.error('Registration failed. Please check your input.')
        }
      }
      return false
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login/', { email, password })
      const { user: loggedInUser, access, refresh } = response.data

      if (!access || !refresh) {
        throw new Error('Invalid response: missing tokens')
      }

      storage.setItem('accessToken', access)
      storage.setItem('refreshToken', refresh)

      setUser(loggedInUser)
      setIsLoggedIn(true)
      setLastChecked(Date.now())

      posthog.identify(loggedInUser.email, {
        email: loggedInUser.email,
        name: loggedInUser.full_name,
      })
      posthog.capture('user_logged_in', { method: 'email' })

      customToast.success('Login successful!', { id: 'auth-login' })
      return { success: true }
    } catch (error) {
      if (IS_DEV) console.error('Login error:', error.response?.data)
      if (error.response?.status === 404) {
        const errorData = error.response.data
        if (errorData.suggest_signup) {
          return { success: false, suggestSignup: true }
        }
      } else if (error.response?.status === 400) {
        const errorData = error.response.data
        if (errorData.email) {
          customToast.error(errorData.email[0], { id: 'auth-login' })
        } else if (errorData.password) {
          customToast.error(errorData.password[0], { id: 'auth-login' })
        } else if (errorData.non_field_errors) {
          customToast.error(errorData.non_field_errors[0], { id: 'auth-login' })
        } else {
          customToast.error('Invalid email or password', { id: 'auth-login' })
        }
      } else if (error.response?.status === 401) {
        customToast.error('Invalid email or password', { id: 'auth-login' })
      } else if (error.response?.status === 500) {
        customToast.error('Server error. Please try again later.', { id: 'auth-login' })
      } else {
        customToast.error('Login failed. Please try again.', { id: 'auth-login' })
      }
      return { success: false }
    }
  }

  const googleLogin = async (googleToken) => {
    try {
      const response = await axiosInstance.post('/auth/google/token/', {
        id_token: googleToken,
        signup_source: 'scrib'
      })

      const { user: loggedInUser, access, refresh } = response.data

      storage.setItem('accessToken', access)
      storage.setItem('refreshToken', refresh)

      setUser(loggedInUser)
      setIsLoggedIn(true)
      setLastChecked(Date.now())

      posthog.identify(loggedInUser.email, {
        email: loggedInUser.email,
        name: loggedInUser.full_name,
      })
      posthog.capture('user_logged_in_google', { method: 'google' })

      customToast.success('Login successful!', { id: 'auth-login' })
      return true
    } catch (error) {
      const status = error.response?.status
      const detail = error.response?.data || error.message || 'Unknown error'
      if (IS_DEV) console.error('Google login error:', { status, detail })

      if (error.response?.status === 400) {
        customToast.error('Google authentication failed. Please try again.', { id: 'auth-login' })
      } else if (error.response?.status === 500) {
        customToast.error('Server error. Please try again later.', { id: 'auth-login' })
      } else {
        customToast.error('Google login failed. Please try again.', { id: 'auth-login' })
      }
      return false
    }
  }

  const logout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    posthog.capture('user_logged_out')
    posthog.reset()
    handleAuthFailure()
    customToast.success('Logged out successfully', { id: 'auth-logout' })
    setTimeout(() => {
      window.location.href = '/'
    }, 500)
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  const setAuthSession = ({ user: sessionUser, access, refresh }) => {
    if (access) storage.setItem('accessToken', access)
    if (refresh) storage.setItem('refreshToken', refresh)
    if (sessionUser) setUser(sessionUser)
    setIsLoggedIn(true)
    setLastChecked(Date.now())
  }

  const isAuthenticated = () => isLoggedIn && !!storage.getItem('accessToken')

  /**
   * Refresh the current user's data (including credit_balance) from the server.
   * Call this after a successful payment to update credits instantly.
   */
  const refreshUser = async () => {
    try {
      const token = storage.getItem('accessToken')
      if (!token) return
      // /scrib/me/ returns id, email, full_name, credit_balance
      const profileUrl = `${axiosInstance.defaults.baseURL}/scrib/me/`
      const response = await axios.get(profileUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const scribData = response.data
      // Merge the scrib credit_balance into the existing user object
      setUser((prev) => ({
        ...(prev || {}),
        credit_balance: scribData.credit_balance,
        full_name: scribData.full_name || prev?.full_name,
      }))
      return scribData
    } catch (err) {
      if (IS_DEV) console.error('refreshUser failed:', err)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoggedIn,
      isAuthenticated,
      register,
      login,
      googleLogin,
      logout,
      setAuthSession,
      validateAuth,
      refreshUser,
    }}>
      {children}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#e2dbd2] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-[#1f1f1f]">Log out</h3>
            <p className="mt-2 text-sm text-[#7b756d]">Are you sure you want to log out of your account?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={cancelLogout} 
                className="rounded-lg px-4 py-2 text-sm font-semibold text-[#1f1f1f] hover:bg-[#f7f4ee] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout} 
                className="rounded-lg bg-[#c05c5c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a74c4c] transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext
