import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import HeroSection from './HeroSection/HeroSection';
import ActiveCourses from './ActiveCourses/ActiveCourses';
import AILearningPlans from './AILearningPlans/AILearningPlans';
import LearningAnalytics from './LearningAnalytics/LearningAnalytics';
import Certificates from '../Profile/tabs/Certificates';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaRocket, FaBookOpen, FaBrain, FaGraduationCap, FaCertificate } from 'react-icons/fa';
import { getLearningStats } from '../../services/activityTracker';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = 'http://localhost:8000';

const LearningHubPage = () => {
  const { user: authUser, isLoggedIn } = useAuth();
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
  const [learningStats, setLearningStats] = useState({
    weekly_hours: 0,
    current_streak: 0,
    today: { hours: 0 }
  });
  
  // Track component renders
  logger.log('🎯 [COMPONENT] LearningHubPage rendered - timestamp:', new Date().toISOString());
  logger.log('🎯 [COMPONENT] Current isLoggedIn:', isLoggedIn);
  logger.log('🎯 [COMPONENT] Current authUser:', authUser);
  logger.log('🎯 [COMPONENT] Current learningStats:', learningStats);
  
  // Track when learningStats state changes
  useEffect(() => {
  logger.log('📊 [STATE CHANGE] learningStats state changed:', learningStats);
  logger.log('📊 [STATE CHANGE] weekly_hours:', learningStats.weekly_hours);
  logger.log('📊 [STATE CHANGE] current_streak:', learningStats.current_streak);
  }, [learningStats]);
  
  useEffect(() => {
    const fetchData = async () => {
  logger.log('🔥 [LEARNING HUB] ========== FETCH DATA START ==========');
  logger.log('🔥 [LEARNING HUB] isLoggedIn:', isLoggedIn);
  logger.log('🔥 [LEARNING HUB] authUser:', authUser);
      
      if (!isLoggedIn) {
  logger.log('🔥 [LEARNING HUB] ❌ User not logged in - skipping data fetch');
        return;
      }

      try {
        // Check token availability first
        const token = localStorage.getItem('accessToken');
  logger.log('🔥 [LEARNING HUB] Access token available:', !!token);
  logger.log('🔥 [LEARNING HUB] Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
        
        // Fetch enrolled courses count
        const coursesResponse = await axios.get(`${API_URL}/api/courses/enrolled/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (coursesResponse.data.success) {
          setEnrolledCoursesCount(coursesResponse.data.courses.length);
        }

        // Fetch learning statistics
        logger.log('🔥 [LEARNING HUB] Fetching learning statistics...');
        logger.log('🔥 [LEARNING HUB] Current learningStats state before fetch:', learningStats);
        const stats = await getLearningStats();
        logger.log('🔥 [LEARNING HUB] Learning stats received from API:', stats);
        logger.log('🔥 [LEARNING HUB] stats object type:', typeof stats);
        logger.log('🔥 [LEARNING HUB] stats.weekly_hours:', stats?.weekly_hours);
        logger.log('🔥 [LEARNING HUB] stats.current_streak:', stats?.current_streak);
        if (stats) {
          logger.log('🔥 [LEARNING HUB] ✅ About to call setLearningStats with:', stats);
          setLearningStats(stats);
          logger.log('🔥 [LEARNING HUB] ✅ setLearningStats called - state should update on next render');
        } else {
          logger.log('🔥 [LEARNING HUB] ⚠️ No learning stats received - API returned null');
        }
      } catch (error) {
        logger.error('❌ Error fetching data:', error);
      }
    };

    fetchData();
  }, [isLoggedIn]);
  
  // Create user object with real learning statistics - ALWAYS use fresh data from API
  const user = {
    name: authUser?.full_name || authUser?.first_name || authUser?.username || "Student",
    totalCoursesEnrolled: enrolledCoursesCount,
    // FORCE real API data to override any dummy data
    hoursThisWeek: learningStats?.weekly_hours ?? 0,
    weeklyGoalHours: 15,
    currentStreak: learningStats?.current_streak ?? 0
  };

  logger.log('🔥 [USER OBJECT] ========== USER OBJECT CREATION ==========');
  logger.log('🔥 [USER OBJECT] Auth user (authUser):', authUser);
  logger.log('🔥 [USER OBJECT] 🚨 Does authUser contain hoursThisWeek?:', authUser?.hoursThisWeek);
  logger.log('🔥 [USER OBJECT] 🚨 Does authUser contain currentStreak?:', authUser?.currentStreak);
  logger.log('🔥 [USER OBJECT] 🚨 Does authUser contain weekly_hours?:', authUser?.weekly_hours);
  logger.log('🔥 [USER OBJECT] 🚨 Does authUser contain current_streak?:', authUser?.current_streak);
  logger.log('🔥 [USER OBJECT] isLoggedIn:', isLoggedIn);
  logger.log('🔥 [USER OBJECT] enrolledCoursesCount:', enrolledCoursesCount);
  logger.log('🔥 [USER OBJECT] Learning stats in state (learningStats):', learningStats);
  logger.log('🔥 [USER OBJECT] learningStats.weekly_hours (raw):', learningStats?.weekly_hours);
  logger.log('🔥 [USER OBJECT] learningStats.current_streak (raw):', learningStats?.current_streak);
  logger.log('🔥 [USER OBJECT] typeof learningStats.weekly_hours:', typeof learningStats?.weekly_hours);
  logger.log('🔥 [USER OBJECT] typeof learningStats.current_streak:', typeof learningStats?.current_streak);
  logger.log('🔥 [USER OBJECT] user.hoursThisWeek after nullish coalescing (??):', user.hoursThisWeek);
  logger.log('🔥 [USER OBJECT] user.currentStreak after nullish coalescing (??):', user.currentStreak);
  logger.log('🔥 [USER OBJECT] 🎯 FINAL USER OBJECT (this goes to HeroSection):', user);
  logger.log('🔥 [USER OBJECT] ===================================================');

  return (
    <>
      <Navbar initialStyle="gradient" />
      <div className="learning-hub-container learning-hub-page min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/50 pt-16 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        {/* Final user object that will be passed to HeroSection */}
        {(() => {
          const finalUserObject = {
            ...user,
            // EXPLICIT OVERRIDE: Use only real API data for learning stats
            hoursThisWeek: learningStats?.weekly_hours ?? 0,
            currentStreak: learningStats?.current_streak ?? 0
          };
          logger.log('🎯 [FINAL] User object being passed to HeroSection:', finalUserObject);
          logger.log('🎯 [FINAL] hoursThisWeek value:', finalUserObject.hoursThisWeek);
          logger.log('🎯 [FINAL] currentStreak value:', finalUserObject.currentStreak);
          return null; // This is just for logging
        })()}
        
        {/* Hero Section - Force real learning stats */}
        <HeroSection 
          user={{
            ...user,
            // EXPLICIT OVERRIDE: Use only real API data for learning stats
            hoursThisWeek: learningStats?.weekly_hours ?? 0,
            currentStreak: learningStats?.current_streak ?? 0
          }} 
        />
        

        
        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* Main Learning Content */}
            <div className="xl:col-span-3 space-y-10">
              
              {/* Expert-Crafted Enrolled Courses Section */}
              <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl mr-4 shadow-lg">
                      <FaGraduationCap className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">My Enrolled Courses</h2>
                      <p className="text-sm text-gray-500 mt-1">Expert-crafted curriculum designed for excellence</p>
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                    Professional
                  </span>
                </div>
                <ActiveCourses />
              </section>
              
              {/* AI-Created Courses Section */}
              <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl mr-4 shadow-lg">
                      <FaBrain className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">My AI-Created Courses</h2>
                      <p className="text-sm text-gray-500 mt-1">Personalized learning paths tailored for you</p>
                    </div>
                  </div>
                  <span className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                    AI-Powered
                  </span>
                </div>
                <AILearningPlans />
              </section>
              
              {/* Certificates Section */}
              <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-xl mr-4 shadow-lg">
                      <FaCertificate className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">My Certificates</h2>
                      <p className="text-sm text-gray-500 mt-1">Your learning achievements and accomplishments</p>
                    </div>
                  </div>
                  <span className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium">
                    Achievements
                  </span>
                </div>
                <Certificates />
              </section>
              
              {/* Minimalistic Call-to-Action Buttons Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 learning-hub">
                
                {/* Create Custom Course with AI */}
                <div className="group bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 text-white hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-lg mr-3">
                        <FaRocket className="text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Create Custom Course</h3>
                        <p className="text-purple-100 text-xs">AI-powered learning paths</p>
                      </div>
                    </div>
                    <Link 
                      to="/chat"
                      className="btn-clickable pointer-events-auto bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors cursor-pointer relative z-50 shadow-sm border border-gray-200"
                      style={{ 
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 50
                      }}
                      onClick={(e) => {
                        logger.log('Start button clicked - navigating to /chat');
                        // Ensure navigation happens
                        e.stopPropagation();
                      }}
                    >
                      Start
                    </Link>
                  </div>
                </div>

                {/* Explore Expert Courses */}
                <div className="group bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-5 text-white hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-lg mr-3">
                        <FaBookOpen className="text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Explore Expert Courses</h3>
                        <p className="text-indigo-100 text-xs">Professional curriculum</p>
                      </div>
                    </div>
                    <Link 
                      to="/courses"
                      className="btn-clickable pointer-events-auto bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors cursor-pointer relative z-50 shadow-sm border border-gray-200"
                      style={{ 
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 50
                      }}
                      onClick={(e) => {
                        logger.log('Browse button clicked - navigating to /courses');
                        // Ensure navigation happens
                        e.stopPropagation();
                      }}
                    >
                      Browse
                    </Link>
                  </div>
                </div>

              </section>

            </div>

            {/* Enhanced Sidebar - Learning Analytics */}
            <div className="xl:col-span-1">
              <div className="sticky top-24">
                <LearningAnalytics 
                  user={{
                    ...user,
                    // Add real learning data for analytics
                    hoursThisWeek: learningStats?.weekly_hours ?? 0,
                    currentStreak: learningStats?.current_streak ?? 0,
                    weeklyBreakdown: learningStats?.weekly_breakdown ?? []
                  }} 
                />
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LearningHubPage;