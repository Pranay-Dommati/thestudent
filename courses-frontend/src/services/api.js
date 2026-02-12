import logger from '../utils/logger';
import axios from '../utils/axios';

// Create a course via backend API; expects FormData
export const createCourse = async (formData) => {
  try {
    const response = await axios.post(`/courses/create/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    logger.error('Error creating course:', error);
    // Re-throw to let callers handle toast/UI
    throw error;
  }
};