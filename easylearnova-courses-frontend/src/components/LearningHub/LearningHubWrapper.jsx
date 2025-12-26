import React, { useState, useEffect } from 'react';
import LearningHubPage from './LearningHubPage';
import MobileLearningHubPage from './MobileLearningHubPage';
import SEO from '../SEO/SEO';

const LearningHubWrapper = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <SEO
        title="Learning Hub - Track Your Progress & Achievements"
        description="Access your enrolled courses, track progress, view achievements, and manage your personalized learning journey on EasyLearnova."
        keywords="learning hub, student dashboard, course progress, learning analytics, achievements, enrolled courses"
        canonical="https://easylearnova.com/learning-hub"
      />
      {isMobile ? <MobileLearningHubPage /> : <LearningHubPage />}
    </>
  );
};

export default LearningHubWrapper;
