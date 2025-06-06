import React, { useEffect } from 'react';
import axiosInstance from '../utils/axios';

// Simple debug component to log information about the Hindi course
const DebugHindiCourse = () => {
  useEffect(() => {
    // Function to debug Hindi course
    const debugHindiCourse = async () => {
      try {
        // Set API base URL
        const API_BASE_URL = 'http://127.0.0.1:8000/api';
        
        // Try to fetch both Hindi and English courses for comparison
        const hindiUrl = `${API_BASE_URL}/courses/school/?class=10th&board=cbse&subject=hindi`;
        const englishUrl = `${API_BASE_URL}/courses/school/?class=10th&board=cbse&subject=english`;
        
        console.log('Fetching Hindi course from:', hindiUrl);
        const hindiResponse = await axiosInstance.get(hindiUrl);
        console.log('Hindi course response:', hindiResponse.data);
        
        console.log('Fetching English course from:', englishUrl);
        const englishResponse = await axiosInstance.get(englishUrl);
        console.log('English course response:', englishResponse.data);
        
        // If Hindi course is found, fetch its details
        if (hindiResponse.data.length > 0) {
          const hindiCourseId = hindiResponse.data[0].id;
          console.log('Fetching Hindi course details with ID:', hindiCourseId);
          
          const hindiDetailsUrl = `${API_BASE_URL}/courses/school/${hindiCourseId}/`;
          const hindiDetailsResponse = await axiosInstance.get(hindiDetailsUrl);
          console.log('Hindi course details:', hindiDetailsResponse.data);
        } else {
          console.error('No Hindi course found in initial response');
        }
      } catch (error) {
        console.error('Error debugging Hindi course:', error);
      }
    };

    debugHindiCourse();
  }, []);

  return (
    <div className="p-4">
      <h1>Hindi Course Debug Page</h1>
      <p>Check browser console for debug information</p>
    </div>
  );
};

export default DebugHindiCourse;
