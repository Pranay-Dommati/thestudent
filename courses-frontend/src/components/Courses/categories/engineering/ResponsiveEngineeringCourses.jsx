import React, { useState, useEffect } from 'react';
import Engineering from './Engineering';
import MobileEngineeringCourses from './MobileEngineeringCourses';

const ResponsiveEngineeringCourses = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on initial load
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile ? <MobileEngineeringCourses /> : <Engineering />;
};

export default ResponsiveEngineeringCourses;
