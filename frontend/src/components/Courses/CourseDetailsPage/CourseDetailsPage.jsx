import React from 'react';
import { useParams } from 'react-router-dom';
import CourseDetails from '../CourseDetails/CourseDetails';

const CourseDetailsPage = () => {
  // Get the courseId from URL parameters
  const { courseId } = useParams();
  
  return (
    <div>
      <CourseDetails courseId={courseId} />
    </div>
  );
};

export default CourseDetailsPage;