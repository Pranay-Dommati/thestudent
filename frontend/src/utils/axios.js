import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8000',  // Your Django backend URL
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;