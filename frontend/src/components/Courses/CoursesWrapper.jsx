import React from 'react';
import useScreenSize from '../../hooks/useScreenSize';
import Courses from './Courses';
import MobileFirstCourses from './MobileFirstCourses';

const CoursesWrapper = () => {
  const { isMobile } = useScreenSize();

  // Render mobile version for screens < 768px, desktop version for tablets and larger
  return isMobile ? <MobileFirstCourses /> : <Courses />;
};

export default CoursesWrapper;
