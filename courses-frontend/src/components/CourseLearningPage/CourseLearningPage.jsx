import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import CourseLearning from './CourseLearning';
import CourseLoadingSkeleton from './CourseLoadingSkeleton';
import { startLearningTracking, stopLearningTracking } from '../../services/activityTracker';
import { useAuth } from '../../context/AuthContext';

const CourseLearningPage = () => {
  // Get all possible URL params from the different route patterns
  const { courseId, subjectId, stateId } = useParams();
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { isLoggedIn } = useAuth();

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
    // If we have a direct courseId (like in engineering courses), use it
    if (courseId) return courseId;
    
    // For school courses, the subject is the identifier
    if (subjectId) return subjectId;
    
    // Extract from pathname as fallback
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

  return (
    <>
      <Navbar initialStyle="light" />
      <div className="pt-14 min-h-screen bg-white">
        <Suspense fallback={<CourseLoadingSkeleton />}>
          <CourseLearning 
            courseId={determineCourseId()}
            pathname={location.pathname}
            onSidebarToggle={handleSidebarToggle}
          />
        </Suspense>
      </div>
      {/* Footer now responds to sidebar visibility */}
      <div className={`transition-all duration-300 ${sidebarVisible ? 'mr-[400px]' : ''}`}>
        <Footer />
      </div>
    </>
  );
};

export default CourseLearningPage;
