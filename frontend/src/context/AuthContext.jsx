import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await axiosInstance.get('/auth/profile/');
          setUser(response.data);
          setIsLoggedIn(true);
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);  const register = async (registrationData) => {
    try {
      const response = await axiosInstance.post('/auth/register/', registrationData);

      const { user, tokens } = response.data;

      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);

      setUser(user);
      setIsLoggedIn(true);

      toast.success('Account created successfully!');
      return true;
    } catch (error) {
      console.error('Error response:', error.response?.data); // Log the error response

      // Extract and display validation errors
      const errorData = error.response?.data;
      if (errorData) {
        if (errorData.password) {
          toast.error(errorData.password[0]); // Show the first password error
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
      console.log('Attempting login with:', { email }); // Log login attempt
      
      const response = await axiosInstance.post('/auth/login/', {
        email: email,
        password: password
      });
      
      console.log('Login response:', response.data); // Log successful response
      
      const { user, access, refresh } = response.data;
      
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      setUser(user);
      setIsLoggedIn(true);
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message); // Log detailed error
      
      // Handle specific error cases
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsLoggedIn(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isLoggedIn, 
      register, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;