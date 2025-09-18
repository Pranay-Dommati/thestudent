import axios from '../utils/axios';
import { toast } from 'react-hot-toast';
import logger from '../utils/logger';

// Base URL comes from axios instance (VITE_API_BASE_URL or default http://127.0.0.1:8000/api)
// For endpoints defined without /api prefix in courses.urls, we need to call absolute paths.
// Since backend mounts courses under root ('' include), prepend '/'
const API_BASE = '';

export const createCourse = async (formData) => {
  try {
    // Log the data being sent for debugging
    logger.log("Sending course data to API");

    // Extract class_level to identify the course type
  const courseType = formData.get('class_level') ? 'school' : 'engineering';
    logger.log(`Creating ${courseType} course...`);
    
    const response = await axios.post(`/courses/create/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
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
    const response = await axios.get(`/courses/`);
  return response.data;
  } catch (error) {
  logger.error('Error fetching courses:', error);
    throw error;
  }
};

export const getEngineeringCourses = async (category = 'all') => {
  try {
  logger.log('Fetching courses for category:', category);
  const response = await axios.get(`/courses/engineering/`, { params: { category } });
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
  const response = await axios.get(`/courses/engineering/${courseId}/`);
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
  const response = await axios.get(`/courses/all/`, { params: { category: cleanCategory } });
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
    
    const params = { class: classLevel, board };
    if (board === 'state' && state) params.state = state;
    logger.log('Requesting school courses with params:', params);
    const response = await axios.get(`/courses/school/`, { params });
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
  const response = await axios.get(`/courses/${courseId}/`);
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
    
    const response = await axios.put(`/courses/${courseId}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
    
    const response = await axios.delete(`/courses/${courseId}/delete/`, { withCredentials: true });
    
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