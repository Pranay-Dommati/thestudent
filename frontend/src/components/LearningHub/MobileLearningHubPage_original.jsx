import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import MobileHeroSection from './MobileHeroSection';
import ActiveCourses from './ActiveCourses/ActiveCourses';
import AILearningPlans from './AILearningPlans/AILearningPlans';
import LearningAnalytics from './LearningAnalytics/LearningAnalytics';
import { useAuth } from '../../context/AuthContext';
import { FaBrain, FaGraduationCap, FaChartLine } from 'react-icons/fa';
import { getLearningStats } from '../../services/activityTracker';
import axiosInstance from '../../utils/axios';
import logger from '../../utils/logger';

// Use relative API base via axiosInstance

const MobileLearningHubPage = () => {
  const { user: authUser, isLoggedIn } = useAuth();
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
  const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled', 'ai', 'analytics'
  const [learningStats, setLearningStats] = useState({
    weekly_hours: 0,
    current_streak: 0,
    today: { hours: 0 }
  });
  
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn) {
        return;
      }

      try {
        // Check token availability first
        const token = localStorage.getItem('accessToken');
        
        // Fetch enrolled courses count
        const coursesResponse = await axiosInstance.get(`/courses/enrolled/`);

        if (coursesResponse.data.success) {
          setEnrolledCoursesCount(coursesResponse.data.courses.length);
        }

        // Fetch learning statistics
        const stats = await getLearningStats();
        if (stats) {
          setLearningStats(stats);
        }
      } catch (error) {
        logger.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [isLoggedIn]);
  
  // Create user object with real learning statistics
  const user = {
    name: authUser?.full_name || authUser?.first_name || authUser?.username || "Student",
    totalCoursesEnrolled: enrolledCoursesCount,
    hoursThisWeek: learningStats?.weekly_hours ?? 0,
    weeklyGoalHours: 15,
    currentStreak: learningStats?.current_streak ?? 0
  };

  return (
    <>
      <Navbar initialStyle="gradient" />
      <div className="mobile-learning-hub min-h-screen bg-white pt-14 pb-20">
        {/* Hero Section with compact mobile design */}
        <div className="px-4 pt-2 pb-4">
          <MobileHeroSection 
            user={{
              ...user,
              hoursThisWeek: learningStats?.weekly_hours ?? 0,
              currentStreak: learningStats?.current_streak ?? 0
            }} 
          />
        </div>

        {/* Main Content - Changes based on active tab */}
        <div className="px-4 pb-24">
          {/* Expert-Crafted Enrolled Courses Section */}
          {activeTab === 'enrolled' && (
            <section className="bg-white rounded-lg p-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">My Enrolled Courses</h2>
              <ActiveCourses />
            </section>
          )}
          
          {/* AI-Created Courses Section */}
          {activeTab === 'ai' && (
            <section className="bg-white rounded-lg p-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">My AI-Created Courses</h2>
              <AILearningPlans />
            </section>
          )}
          
          {/* Learning Analytics Section - Mobile View */}
          {activeTab === 'analytics' && (
            <section className="bg-white rounded-lg p-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Learning Analytics</h2>
              <LearningAnalytics 
                user={{
                  ...user,
                  hoursThisWeek: learningStats?.weekly_hours ?? 0,
                  currentStreak: learningStats?.current_streak ?? 0,
                  weeklyBreakdown: learningStats?.weekly_breakdown ?? []
                }} 
              />
            </section>
          )}
        </div>

        {/* Bottom Tab Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3 px-2 z-20">
          <button 
            className={`flex flex-col items-center ${activeTab === 'enrolled' ? 'text-indigo-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('enrolled')}
          >
            <FaGraduationCap className="text-lg mb-1" />
            <span className="text-xs">Enrolled</span>
          </button>
          
          <button 
            className={`flex flex-col items-center ${activeTab === 'ai' ? 'text-indigo-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('ai')}
          >
            <FaBrain className="text-lg mb-1" />
            <span className="text-xs">AI Courses</span>
          </button>
          
          <button 
            className={`flex flex-col items-center ${activeTab === 'analytics' ? 'text-indigo-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FaChartLine className="text-lg mb-1" />
            <span className="text-xs">Analytics</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileLearningHubPage;
