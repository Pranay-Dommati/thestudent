// Add this function to your API service

export const createCourse = async (formData) => {
  try {
    const response = await fetch('http://localhost:8000/api/courses/create/', {
      method: 'POST',
      body: formData, // Send as FormData (multipart/form-data)
      // Don't set Content-Type header, it will be set automatically with boundary
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create course');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};