import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../utils/axios';

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
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axiosInstance.post('/auth/token/refresh/', {
        refresh: refreshToken
      });

      if (response.data.access) {
        localStorage.setItem('accessToken', response.data.access);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Function to validate current auth state
  const validateAuth = async () => {
    const token = localStorage.getItem('accessToken');
    const now = Date.now();
    
    // Only check if we haven't checked in the last minute
    if (now - lastChecked < 60000) {
      return isLoggedIn;
    }

    if (!token) {
      setIsLoggedIn(false);
      setUser(null);
      return false;
    }

    try {
      const response = await axiosInstance.get('/auth/profile/');
      setUser(response.data);
      setIsLoggedIn(true);
      setLastChecked(now);
      return true;
    } catch (error) {
      // If token is invalid, try to refresh it
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the profile fetch with new token
        try {
          const retryResponse = await axiosInstance.get('/auth/profile/');
          setUser(retryResponse.data);
          setIsLoggedIn(true);
          setLastChecked(now);
          return true;
        } catch (retryError) {
          handleAuthFailure();
          return false;
        }
      } else {
        handleAuthFailure();
        return false;
      }
    }
  };

  const handleAuthFailure = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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

      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);

      setUser(user);
      setIsLoggedIn(true);
      setLastChecked(Date.now());

      toast.success('Account created successfully!');
      return true;
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      
      const errorData = error.response?.data;
      if (errorData) {
        if (errorData.password) {
          toast.error(errorData.password[0]);
        } else if (errorData.email) {
          toast.error(errorData.email[0]);
        } else if (errorData.full_name) {
          toast.error(errorData.full_name[0]);
        } else if (errorData.non_field_errors) {
          toast.error(errorData.non_field_errors[0]);
        } else {
          toast.error('Registration failed. Please check your input.');
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
      
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      setUser(user);
      setIsLoggedIn(true);
      setLastChecked(Date.now());
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.email) {
          toast.error(errorData.email[0]);
        } else if (errorData.password) {
          toast.error(errorData.password[0]);
        } else if (errorData.non_field_errors) {
          toast.error(errorData.non_field_errors[0]);
        } else {
          toast.error('Invalid email or password');
        }
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Login failed. Please try again.');
      }
      return false;
    }
  };

  const logout = () => {
    handleAuthFailure();
    toast.success('Logged out successfully');
  };

  // Export isAuthenticated as a function to always check current state
  const isAuthenticated = () => {
    return isLoggedIn && !!localStorage.getItem('accessToken');
  };
  return (
    <AuthContext.Provider value={{ 
      user,
      loading,
      isLoggedIn,
      isAuthenticated, // Export the function as well
      register,
      login,
      logout,
      validateAuth // Export the validate function
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;