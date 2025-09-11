import axios from 'axios';
import { toast } from 'react-hot-toast';
import logger from '../utils/logger';

const API_URL = 'http://localhost:8000'; // Adjust this to your Django backend URL

// Helper to read CSRF cookie set by Django (if present)
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// Get best-available access token from localStorage
function getAccessToken() {
  if (typeof localStorage === 'undefined') return null;
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    null
  );
}

export const createCourse = async (formData) => {
  try {
    // Log the data being sent for debugging
    logger.log("Sending course data to API");

    // Extract class_level to identify the course type
  const courseType = formData.get('class_level') ? 'school' : 'engineering';
    logger.log(`Creating ${courseType} course...`);
    
    const token = getAccessToken();
    const csrfToken = getCookie('csrftoken');
    const response = await axios.post(`${API_URL}/api/courses/create/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      },
      // Ensure axios uses Django's CSRF names if cookie is present
      xsrfCookieName: 'csrftoken',
      xsrfHeaderName: 'X-CSRFToken',
      withCredentials: true, // allow cookies if a session exists
    });
    
  logger.log("API response:", response.data);
    return response.data;
  } catch (error) {
  logger.error('Error creating course:', error);
    
    if (error.response?.status === 403) {
      toast.error('Permission denied. Please check your authentication.');
    } else if (error.response?.status === 400) {
      const errorMessage = typeof error.response.data === 'object' 
        ? JSON.stringify(error.response.data) 
        : error.response.data;
      toast.error(`Bad request: ${errorMessage}`);
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Please make sure the backend is running.');
    } else {
      toast.error(error.response?.data?.message || 'Failed to create course');
    }
    throw error;
  }
};

export const getCourses = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/courses/`);
  return response.data;
  } catch (error) {
  logger.error('Error fetching courses:', error);
    throw error;
  }
};

export const getEngineeringCourses = async (category = 'all') => {
  try {
  logger.log('Fetching courses for category:', category);
    const response = await axios.get(`${API_URL}/api/courses/engineering/?category=${category}`);
  logger.log('Course data received:', response.data);
    return response.data;
  } catch (error) {
  logger.error('Error fetching courses:', error);
    throw error;
  }
};

export const getEngineeringCourseById = async (courseId) => {
  try {
  logger.log('Fetching course details for ID:', courseId);
    const response = await axios.get(`${API_URL}/api/courses/engineering/${courseId}/`);
  logger.log('Course details received:', response.data);
    return response.data;
  } catch (error) {
  logger.error('Error fetching course details:', error);
    throw error;
  }
};

export const getAllCourses = async (category = 'all') => {
  try {
    // Remove any colon prefix from category if present (e.g., ":1" becomes "1")
    const cleanCategory = category.toString().replace(/^:/, '');
  logger.log('Fetching all courses for category:', cleanCategory);
    const response = await axios.get(`${API_URL}/api/courses/all/?category=${cleanCategory}`);
  logger.log('Course data received:', response.data);
    return response.data;
  } catch (error) {
  logger.error('Error fetching courses:', error);
    throw error;
  }
};

export const getSchoolCourses = async (classLevel, board, state = '') => {
  try {
  logger.log(`API call: getSchoolCourses(${classLevel}, ${board}, ${state})`);
    
    let url = `${API_URL}/api/courses/school/?class=${classLevel}&board=${board}`;
    if (board === 'state' && state) {
      url += `&state=${state}`;
    }
    
  logger.log(`Requesting URL: ${url}`);
    const response = await axios.get(url);
  logger.log(`Received ${response.data.length} courses from API`); 
    return response.data;
  } catch (error) {
  logger.error('Error fetching school courses:', error);
    return [];
  }
};

export const getCourseById = async (courseId) => {
  try {
  logger.log('Fetching course by ID:', courseId);
    const response = await axios.get(`${API_URL}/api/courses/${courseId}/`);
  logger.log('Course data received:', response.data);
    return response.data;
  } catch (error) {
  logger.error('Error fetching course by ID:', error);
    throw error;
  }
};

export const updateCourse = async (courseId, formData) => {
  try {
  logger.log("Updating course with ID:", courseId);
  logger.log("Update data:", formData);
    
    const token = getAccessToken();
    const csrfToken = getCookie('csrftoken');
    const response = await axios.put(`${API_URL}/api/courses/${courseId}/update/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      },
      xsrfCookieName: 'csrftoken',
      xsrfHeaderName: 'X-CSRFToken',
      withCredentials: true,
    });
    
  logger.log("Update API response:", response.data);
    return response.data;
  } catch (error) {
  logger.error('Error updating course:', error);
    
    if (error.response?.status === 403) {
      toast.error('Permission denied. Please check your authentication.');
    } else if (error.response?.status === 400) {
      const errorMessage = typeof error.response.data === 'object' 
        ? JSON.stringify(error.response.data) 
        : error.response.data;
      toast.error(`Bad request: ${errorMessage}`);
    } else if (error.response?.status === 404) {
      toast.error('Course not found.');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Please make sure the backend is running.');
    } else {
      toast.error(error.response?.data?.message || 'Failed to update course');
    }
    throw error;
  }
};

export const deleteCourse = async (courseId) => {
  try {
  logger.log("Deleting course with ID:", courseId);
    
    const token = getAccessToken();
    const csrfToken = getCookie('csrftoken');
    const response = await axios.delete(`${API_URL}/api/courses/${courseId}/delete/`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      },
      xsrfCookieName: 'csrftoken',
      xsrfHeaderName: 'X-CSRFToken',
      withCredentials: true,
    });
    
  logger.log("Delete API response:", response.data);
    return response.data;
  } catch (error) {
  logger.error('Error deleting course:', error);
    
    if (error.response?.status === 403) {
      toast.error('Permission denied. Please check your authentication.');
    } else if (error.response?.status === 404) {
      toast.error('Course not found.');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Please make sure the backend is running.');
    } else {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    }
    throw error;
  }
};