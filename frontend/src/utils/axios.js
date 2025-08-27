import axios from 'axios';
import indexedDBService from '../services/IndexedDBService.js';

const instance = axios.create({
  baseURL: 'http://localhost:8000/api',  // Your Django backend URL with /api prefix
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
// Note: Axios request interceptors can be async to await token from IndexedDB
instance.interceptors.request.use(
  async (config) => {
    let token = await indexedDBService.getItem('accessToken');
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('accessToken');
      // Backfill IndexedDB for future requests
      if (token) {
        indexedDBService.setItem('accessToken', token);
      }
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;