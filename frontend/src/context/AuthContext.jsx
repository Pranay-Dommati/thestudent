import { createContext, useContext, useState, useEffect } from 'react';
import customToast from '../utils/customToast';
import axiosInstance from '../utils/axios';
import storage from '../utils/storage';

const AuthContext = createContext(null);

const TOKEN_REFRESH_INTERVAL = 1000 * 60 * 4; // 4 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lastChecked, setLastChecked] = useState(0);

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    try {
  const refreshToken = storage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('No refresh token found');
        handleAuthFailure();
        throw new Error('No refresh token');
      }

      const response = await axiosInstance.post('/auth/token/refresh/', {
        refresh: refreshToken
      });

      if (response.data.access) {
        storage.setItem('accessToken', response.data.access);
        if (response.data.refresh) {
          storage.setItem('refreshToken', response.data.refresh);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleAuthFailure();
      throw error;
    }
  };

  // Function to validate current auth state
  const validateAuth = async () => {
  const token = storage.getItem('accessToken');
  const refreshToken = storage.getItem('refreshToken');
    const now = Date.now();
    
    // Only check if we haven't checked in the last minute and we're already logged in
    if (now - lastChecked < 60000 && isLoggedIn) {
      return true;
    }

    if (!token || !refreshToken) {
      handleAuthFailure();
      return false;
    }

    try {
      // First try with current access token
      try {
        const response = await axiosInstance.get('/auth/profile/');
        setUser(response.data);
        setIsLoggedIn(true);
        setLastChecked(now);
        return true;
      } catch (error) {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await refreshAccessToken();
          // Retry with new token
          const retryResponse = await axiosInstance.get('/auth/profile/');
          setUser(retryResponse.data);
          setIsLoggedIn(true);
          setLastChecked(now);
          return true;
        }
        throw error;
      }
    } catch (error) {
      console.error('Auth validation failed:', error);
      handleAuthFailure();
      return false;
    }
  };

  const handleAuthFailure = () => {
  storage.clearAuthTokens();
  // IndexedDB no longer used
    setUser(null);
    setIsLoggedIn(false);
    setLastChecked(0);
  };

  // Initial auth check
  useEffect(() => {
    validateAuth().finally(() => setLoading(false));
  }, []);

  // Set up periodic token refresh
  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(refreshAccessToken, TOKEN_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Handle visibility change for mobile browsers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateAuth();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', validateAuth);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', validateAuth);
    };
  }, []);

  const register = async (registrationData) => {
    try {
      const response = await axiosInstance.post('/auth/register/', registrationData);
      const { user, tokens } = response.data;

  storage.setItem('accessToken', tokens.access);
  storage.setItem('refreshToken', tokens.refresh);

      setUser(user);
      setIsLoggedIn(true);
      setLastChecked(Date.now());

      customToast.success('Account created successfully!');
      return true;
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      
      const errorData = error.response?.data;
      if (errorData) {
        if (errorData.password) {
          customToast.error(errorData.password[0]);
        } else if (errorData.email) {
          customToast.error(errorData.email[0]);
        } else if (errorData.full_name) {
          customToast.error(errorData.full_name[0]);
        } else if (errorData.non_field_errors) {
          customToast.error(errorData.non_field_errors[0]);
        } else {
          customToast.error('Registration failed. Please check your input.');
        }
      }
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login/', {
        email,
        password
      });
      
      const { user, access, refresh } = response.data;
      
      if (!access || !refresh) {
        throw new Error('Invalid response: missing tokens');
      }
      
  storage.setItem('accessToken', access);
  storage.setItem('refreshToken', refresh);
      
      setUser(user);
      setIsLoggedIn(true);
      setLastChecked(Date.now());
      
      customToast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.email) {
          customToast.error(errorData.email[0]);
        } else if (errorData.password) {
          customToast.error(errorData.password[0]);
        } else if (errorData.non_field_errors) {
          customToast.error(errorData.non_field_errors[0]);
        } else {
          customToast.error('Invalid email or password');
        }
      } else if (error.response?.status === 401) {
        customToast.error('Invalid email or password');
      } else if (error.response?.status === 500) {
        customToast.error('Server error. Please try again later.');
      } else {
        customToast.error('Login failed. Please try again.');
      }
      return false;
    }
  };

  const logout = () => {
    handleAuthFailure();
    customToast.success('Logged out successfully');
  };

  // Google Sign-In function
  const googleLogin = async (googleToken) => {
    try {
      const response = await axiosInstance.post('/auth/google/token/', {
        id_token: googleToken
      });
      
      const { user, access, refresh } = response.data;
      
  storage.setItem('accessToken', access);
  storage.setItem('refreshToken', refresh);
      
      setUser(user);
      setIsLoggedIn(true);
      setLastChecked(Date.now());
      
      customToast.success('Login successful!');
      return true;
    } catch (error) {
      // Log richer details to help diagnose undefined cases (e.g., network/CORS)
      const status = error.response?.status;
      const data = error.response?.data;
      const detail = data || error.message || 'Unknown error';
      console.error('Google login error:', { status, detail });
      
      if (error.response?.status === 400) {
        customToast.error('Google authentication failed. Please try again.');
      } else if (error.response?.status === 500) {
        customToast.error('Server error. Please try again later.');
      } else {
        customToast.error('Google login failed. Please try again.');
      }
      return false;
    }
  };

  // Export isAuthenticated as a function to always check current state
  const isAuthenticated = () => {
  return isLoggedIn && !!storage.getItem('accessToken');
  };
  return (
    <AuthContext.Provider value={{ 
      user,
      loading,
      isLoggedIn,
      isAuthenticated, // Export the function as well
      register,
      login,
      googleLogin,
      logout,
      validateAuth // Export the validate function
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;