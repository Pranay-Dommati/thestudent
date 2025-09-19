import React, { useEffect } from 'react';
import axiosInstance from '../utils/axios';

// Simple debug component to log information about the Hindi course
const DebugHindiCourse = () => {
  useEffect(() => {
    // Function to debug Hindi course
    const debugHindiCourse = async () => {
      try {
  // Build relative URLs so dev proxy handles routing
  const hindiUrl = `/api/courses/school/?class=10th&board=cbse&subject=hindi`;
  const englishUrl = `/api/courses/school/?class=10th&board=cbse&subject=english`;
        
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
          
          const hindiDetailsUrl = `/api/courses/school/${hindiCourseId}/`;
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
