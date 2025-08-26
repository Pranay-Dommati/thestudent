import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:8000'; // Adjust this to your Django backend URL

export const createCourse = async (formData) => {
  try {
    // Log the data being sent for debugging
    console.log("Sending course data to API");

    // Extract class_level to identify the course type
    const courseType = formData.get('class_level') ? 'school' : 'engineering';
    console.log(`Creating ${courseType} course...`);
    
    const response = await axios.post(`${API_URL}/api/courses/create/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true, // Important for CORS
    });
    
    console.log("API response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    
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
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const getEngineeringCourses = async (category = 'all') => {
  try {
    const response = await axios.get(`${API_URL}/api/courses/engineering/?category=${category}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const getEngineeringCourseById = async (courseId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courses/engineering/${courseId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course details:', error);
    throw error;
  }
};

export const getAllCourses = async (category = 'all') => {
  try {
    // Remove any colon prefix from category if present (e.g., ":1" becomes "1")
    const cleanCategory = category.toString().replace(/^:/, '');
    const response = await axios.get(`${API_URL}/api/courses/all/?category=${cleanCategory}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

export const getSchoolCourses = async (classLevel, board, state = '') => {
  try {
    let url = `${API_URL}/api/courses/school/?class=${classLevel}&board=${board}`;
    if (board === 'state' && state) {
      url += `&state=${state}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching school courses:', error);
    return [];
  }
};

export const getCourseById = async (courseId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courses/${courseId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    throw error;
  }
};

export const updateCourse = async (courseId, formData) => {
  try {
    console.log("Updating course with ID:", courseId);
    console.log("Update data:", formData);
    
    const response = await axios.put(`${API_URL}/api/courses/${courseId}/update/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });
    
    console.log("Update API response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating course:', error);
    
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
    console.log("Deleting course with ID:", courseId);
    
    const response = await axios.delete(`${API_URL}/api/courses/${courseId}/delete/`, {
      withCredentials: true,
    });
    
    console.log("Delete API response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting course:', error);
    
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