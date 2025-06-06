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
      <Navbar initialStyle="gradient" />
      <div className="min-h-screen bg-gray-50 pt-16">
        <HeroSection user={user} />
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content - 2/3 width on large screens */}
            <div className="lg:col-span-2 space-y-8">
              <ActiveCourses />
              <AILearningPlans />
              <SavedPlaylists />
              <CourseRecommendations />
            </div>
            
            {/* Sidebar - 1/3 width on large screens */}
            <div className="space-y-8">
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