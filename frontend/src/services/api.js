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

export const saveAIGeneratedPlan = async (planData, token) => {
  try {
    const response = await fetch('http://localhost:8000/api/learning/plans/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(planData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save AI-generated plan');
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving AI-generated plan:', error);
    throw error;
  }
};

export const fetchUserAIGeneratedPlans = async (token) => {
  try {
    const response = await fetch('http://localhost:8000/api/learning/user-plans/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user AI-generated plans');
    }
    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error('Error fetching user AI-generated plans:', error);
    throw error;
  }
};

export const saveAITopicContent = async (data, token) => {
  try {
    const response = await fetch('http://localhost:8000/api/courses/ai-topic-content/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save AI topic content');
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving AI topic content:', error);
    throw error;
  }
};

export const fetchAITopicContent = async (token, courseTitle = null, topicName = null) => {
  try {
    let url = 'http://localhost:8000/api/courses/ai-topic-content/';
    const params = [];
    if (courseTitle) params.push(`course_title=${encodeURIComponent(courseTitle)}`);
    if (topicName) params.push(`topic_name=${encodeURIComponent(topicName)}`);
    if (params.length) url += '?' + params.join('&');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch AI topic content');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching AI topic content:', error);
    throw error;
  }
};