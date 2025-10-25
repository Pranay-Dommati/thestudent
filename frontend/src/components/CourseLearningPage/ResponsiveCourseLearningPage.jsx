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
  const { isLoggedIn } = useAuth();

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

  // Determine the actual course ID based on URL pattern
  const determineCourseId = () => {
    // 1) Prefer explicit courseId from query string to disambiguate (e.g., Maths 1A vs 1B)
    const searchParams = new URLSearchParams(location.search || '');
    const queryCourseId = searchParams.get('courseId');
    if (queryCourseId) return queryCourseId;

    // 2) If we have a path param courseId (like in engineering courses), use it
    if (courseId) return courseId;
    
    // 3) For school courses, the subject is the identifier
    if (subjectId) return subjectId;
    
    // 4) Extract from pathname as fallback
    const pathParts = location.pathname.split('/');
    
    // Return the last non-empty part before 'learning'
    const learningIndex = pathParts.indexOf('learning');
    if (learningIndex > 1) {
      return pathParts[learningIndex - 1];
    }
    
    return null;
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
