import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import CourseLearning from './CourseLearning';
import MobileCourseLearning from './MobileCourseLearning';
import { startLearningTracking, stopLearningTracking } from '../../services/activityTracker';
import { useAuth } from '../../context/AuthContext';

const ResponsiveCourseLearningPage = () => {
  // Get all possible URL params from the different route patterns
  const { courseId, subjectId, stateId } = useParams();
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  // Avoid destructuring from null when provider hasn't mounted yet
  const auth = useAuth();
  const isLoggedIn = !!auth?.isLoggedIn;

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // Use 768px as mobile breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Activity tracking - Start tracking when learning
  useEffect(() => {
  if (isLoggedIn) {
      console.log('🎯 Starting learning activity tracking for Course Learning page');
      startLearningTracking();
      
      return () => {
        console.log('⏹️ Stopping learning activity tracking for Course Learning page');
        stopLearningTracking();
      };
    }
  }, [isLoggedIn]);

  // Determine the actual course ID (ID-based only; no subject/slug fallback)
  const determineCourseId = () => {
    const searchParams = new URLSearchParams(location.search || '');
    const queryCourseId = searchParams.get('courseId');
    // Prefer explicit query param, then path param. If neither exists we return null.
    return queryCourseId || courseId || null;
  };

  // Callback to receive sidebar visibility changes from CourseLearning component
  const handleSidebarToggle = (isVisible) => {
    setSidebarVisible(isVisible);
  };

  // For mobile, don't show navbar and footer in learning mode
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white overflow-y-auto">
        <MobileCourseLearning 
          courseId={determineCourseId()}
          pathname={location.pathname}
          onSidebarToggle={handleSidebarToggle}
        />
      </div>
    );
  }

  // Desktop version with original layout
  return (
    <>
      <Navbar initialStyle="light" />
      <div className="pt-14 min-h-screen bg-white">
        <CourseLearning 
          courseId={determineCourseId()}
          pathname={location.pathname}
          onSidebarToggle={handleSidebarToggle}
        />
      </div>
      {/* Footer now responds to sidebar visibility */}
      <div className={`transition-all duration-300 ${sidebarVisible ? 'mr-[400px]' : ''}`}>
        <Footer />
      </div>
    </>
  );
};

export default ResponsiveCourseLearningPage;
