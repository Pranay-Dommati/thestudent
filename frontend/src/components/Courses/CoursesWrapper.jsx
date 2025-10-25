import React from 'react';
import useScreenSize from '../../hooks/useScreenSize';
import Courses from './Courses';
import MobileFirstCourses from './MobileFirstCourses';
import SEO from '../SEO/SEO';

const CoursesWrapper = () => {
  const { isMobile } = useScreenSize();

  return (
    <>
      <SEO
        title="Structured Courses for School Students | CBSE & State Board Syllabus"
        description="Master your school subjects with EasyLearnova's structured courses designed for 6th to 12th standard students. Access board-specific content aligned with CBSE and State Board syllabus. Get comprehensive lessons, practice questions, and exam preparation—all organized by grade and subject for effective learning."
        keywords="school courses, CBSE courses, state board syllabus, 6th to 12th standard, structured learning, board exam preparation, subject-wise courses, school syllabus courses, grade-wise learning"
        canonical="https://easylearnova.com/courses"
      />
      {isMobile ? <MobileFirstCourses /> : <Courses />}
    </>
  );
};

export default CoursesWrapper;
