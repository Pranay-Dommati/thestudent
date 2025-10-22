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
        title="Courses - Browse Free AI-Curated Learning Playlists"
        description="Browse EasyLearnova courses: curated, free playlists across subjects and levels (6th–12th). Filter by board or topic and start learning today."
        keywords="free courses, online courses, CBSE courses, state board courses, 6th to 12th standard, curated learning playlists"
        canonical="https://easylearnova.com/courses"
      />
      {isMobile ? <MobileFirstCourses /> : <Courses />}
    </>
  );
};

export default CoursesWrapper;
