import React, { useState, useEffect } from 'react';
import LearningHubPage from './LearningHubPage';
import MobileLearningHubPage from './MobileLearningHubPage';

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

  return isMobile ? <MobileLearningHubPage /> : <LearningHubPage />;
};

export default LearningHubWrapper;
