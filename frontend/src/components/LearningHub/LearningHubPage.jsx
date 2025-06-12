import React from 'react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import HeroSection from './HeroSection/HeroSection';
import ActiveCourses from './ActiveCourses/ActiveCourses';
import SavedPlaylists from './SavedPlaylists/SavedPlaylists';
import LearningAnalytics from './LearningAnalytics/LearningAnalytics';
import CourseRecommendations from './CourseRecommendations/CourseRecommendations';
import AILearningPlans from './AILearningPlans/AILearningPlans';

const LearningHubPage = () => {
  // Mock user data - in a real app, this would come from authentication context
  const user = {
    name: "Alex",
    lastCourse: {
      id: "course-123",
      title: "Advanced React Patterns",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop",
      progress: 45
    },
    totalCoursesEnrolled: 8,
    hoursThisWeek: 12.5,
    certificatesEarned: 3
  };

  return (
    <>
      <Navbar initialStyle="gradient" />      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section with better mobile padding */}
        <HeroSection user={user} />
        
        {/* Main container with improved mobile spacing */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Main content - Improved spacing on mobile */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Order components for better mobile experience */}
              <div className="block lg:hidden">
                <LearningAnalytics user={user} />
              </div>
              <ActiveCourses />
              <AILearningPlans />
              <SavedPlaylists />
              <CourseRecommendations />
            </div>
            
            {/* Sidebar - Hidden on mobile, shown at top of main content */}
            <div className="hidden lg:block space-y-6 lg:space-y-8 lg:sticky lg:top-20">
              <LearningAnalytics user={user} />
              {/* Additional sidebar components can be added here */}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LearningHubPage;