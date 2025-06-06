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
  }, []);

  const register = async (name, email, password) => {
    try {
      const response = await axiosInstance.post('/auth/register/', {
        full_name: name,
        email: email,
        password: password
      });

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
        email: email,
        password: password
      });
      
      const { user, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      
      setUser(user);
      setIsLoggedIn(true);
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error('Invalid email or password');
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