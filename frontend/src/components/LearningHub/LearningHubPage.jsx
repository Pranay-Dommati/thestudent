import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import HeroSection from './HeroSection/HeroSection';
import ActiveCourses from './ActiveCourses/ActiveCourses';
import AILearningPlans from './AILearningPlans/AILearningPlans';
import LearningAnalytics from './LearningAnalytics/LearningAnalytics';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaRocket, FaBookOpen, FaBrain, FaGraduationCap } from 'react-icons/fa';
import { getLearningStats } from '../../services/activityTracker';
import axios from 'axios';

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
  console.log('🎯 [COMPONENT] LearningHubPage rendered - timestamp:', new Date().toISOString());
  console.log('🎯 [COMPONENT] Current isLoggedIn:', isLoggedIn);
  console.log('🎯 [COMPONENT] Current authUser:', authUser);
  console.log('🎯 [COMPONENT] Current learningStats:', learningStats);
  
  // Track when learningStats state changes
  useEffect(() => {
    console.log('📊 [STATE CHANGE] learningStats state changed:', learningStats);
    console.log('📊 [STATE CHANGE] weekly_hours:', learningStats.weekly_hours);
    console.log('📊 [STATE CHANGE] current_streak:', learningStats.current_streak);
  }, [learningStats]);
  
  useEffect(() => {
    const fetchData = async () => {
      console.log('🔥 [LEARNING HUB] ========== FETCH DATA START ==========');
      console.log('🔥 [LEARNING HUB] isLoggedIn:', isLoggedIn);
      console.log('🔥 [LEARNING HUB] authUser:', authUser);
      
      if (!isLoggedIn) {
        console.log('🔥 [LEARNING HUB] ❌ User not logged in - skipping data fetch');
        return;
      }

      try {
        // Check token availability first
        const token = localStorage.getItem('accessToken');
        console.log('🔥 [LEARNING HUB] Access token available:', !!token);
        console.log('🔥 [LEARNING HUB] Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
        
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
        console.log('🔥 [LEARNING HUB] Fetching learning statistics...');
        console.log('🔥 [LEARNING HUB] Current learningStats state before fetch:', learningStats);
        const stats = await getLearningStats();
        console.log('🔥 [LEARNING HUB] Learning stats received from API:', stats);
        console.log('🔥 [LEARNING HUB] stats object type:', typeof stats);
        console.log('🔥 [LEARNING HUB] stats.weekly_hours:', stats?.weekly_hours);
        console.log('🔥 [LEARNING HUB] stats.current_streak:', stats?.current_streak);
        if (stats) {
          console.log('🔥 [LEARNING HUB] ✅ About to call setLearningStats with:', stats);
          setLearningStats(stats);
          console.log('🔥 [LEARNING HUB] ✅ setLearningStats called - state should update on next render');
        } else {
          console.log('🔥 [LEARNING HUB] ⚠️ No learning stats received - API returned null');
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
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

  // Enhanced debug logging
  console.log('🔥 [USER OBJECT] ========== USER OBJECT CREATION ==========');
  console.log('🔥 [USER OBJECT] Auth user (authUser):', authUser);
  console.log('🔥 [USER OBJECT] 🚨 Does authUser contain hoursThisWeek?:', authUser?.hoursThisWeek);
  console.log('🔥 [USER OBJECT] 🚨 Does authUser contain currentStreak?:', authUser?.currentStreak);
  console.log('🔥 [USER OBJECT] 🚨 Does authUser contain weekly_hours?:', authUser?.weekly_hours);
  console.log('🔥 [USER OBJECT] 🚨 Does authUser contain current_streak?:', authUser?.current_streak);
  console.log('🔥 [USER OBJECT] isLoggedIn:', isLoggedIn);
  console.log('🔥 [USER OBJECT] enrolledCoursesCount:', enrolledCoursesCount);
  console.log('🔥 [USER OBJECT] Learning stats in state (learningStats):', learningStats);
  console.log('🔥 [USER OBJECT] learningStats.weekly_hours (raw):', learningStats?.weekly_hours);
  console.log('🔥 [USER OBJECT] learningStats.current_streak (raw):', learningStats?.current_streak);
  console.log('🔥 [USER OBJECT] typeof learningStats.weekly_hours:', typeof learningStats?.weekly_hours);
  console.log('🔥 [USER OBJECT] typeof learningStats.current_streak:', typeof learningStats?.current_streak);
  console.log('🔥 [USER OBJECT] user.hoursThisWeek after nullish coalescing (??):', user.hoursThisWeek);
  console.log('🔥 [USER OBJECT] user.currentStreak after nullish coalescing (??):', user.currentStreak);
  console.log('🔥 [USER OBJECT] 🎯 FINAL USER OBJECT (this goes to HeroSection):', user);
  console.log('🔥 [USER OBJECT] ===================================================');

  // Debug function to manually test activity tracking
  const testActivityTracking = async () => {
    try {
      const { trackLearningMinutes } = await import('../../services/activityTracker');
      console.log('🧪 Testing manual activity tracking...');
      const success = await trackLearningMinutes(5);
      if (success) {
        console.log('✅ Successfully tracked 5 minutes');
        // Refresh stats
        const { getLearningStats } = await import('../../services/activityTracker');
        const newStats = await getLearningStats();
        if (newStats) {
          setLearningStats(newStats);
          console.log('🔄 Stats refreshed:', newStats);
        }
      } else {
        console.log('❌ Failed to track activity');
      }
    } catch (error) {
      console.error('❌ Error testing activity tracking:', error);
    }
  };

  return (
    <>
      <Navbar initialStyle="gradient" />
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Final user object that will be passed to HeroSection */}
        {(() => {
          const finalUserObject = {
            ...user,
            // EXPLICIT OVERRIDE: Use only real API data for learning stats
            hoursThisWeek: learningStats?.weekly_hours ?? 0,
            currentStreak: learningStats?.current_streak ?? 0
          };
          console.log('🎯 [FINAL] User object being passed to HeroSection:', finalUserObject);
          console.log('🎯 [FINAL] hoursThisWeek value:', finalUserObject.hoursThisWeek);
          console.log('🎯 [FINAL] currentStreak value:', finalUserObject.currentStreak);
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
        
        {/* Debug Button - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={testActivityTracking}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              🧪 Test Activity Tracking (+5 min)
            </button>
          </div>
        )}
        
        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* Main Learning Content */}
            <div className="xl:col-span-3 space-y-8">
              
              {/* Expert-Crafted Enrolled Courses Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FaGraduationCap className="mr-3 text-indigo-600" />
                    My Enrolled Courses
                  </h2>
                  <span className="text-sm text-gray-500">Expert-crafted curriculum</span>
                </div>
                <ActiveCourses />
              </section>
              
              {/* AI-Created Courses Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FaBrain className="mr-3 text-purple-600" />
                    My AI-Created Courses
                  </h2>
                  <span className="text-sm text-gray-500">Personalized learning paths</span>
                </div>
                <AILearningPlans />
              </section>
              
              {/* Call-to-Action Buttons Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Create Custom Course with AI */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
                  <div className="flex items-center mb-4">
                    <FaRocket className="text-2xl mr-3" />
                    <div>
                      <h3 className="text-xl font-bold">Create Custom Course</h3>
                      <p className="text-purple-100 text-sm">AI-powered personalized learning</p>
                    </div>
                  </div>
                  <p className="text-purple-100 mb-4 text-sm">
                    Let our AI create a personalized course tailored to your specific learning goals and interests.
                  </p>
                  <Link 
                    to="/chat"
                    className="inline-flex items-center px-4 py-2 bg-white text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                  >
                    <FaBrain className="mr-2" />
                    Start Creating
                  </Link>
                </div>

                {/* Explore Expert Courses */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-xl p-6 text-white">
                  <div className="flex items-center mb-4">
                    <FaBookOpen className="text-2xl mr-3" />
                    <div>
                      <h3 className="text-xl font-bold">Explore Expert Courses</h3>
                      <p className="text-indigo-100 text-sm">Professionally crafted curriculum</p>
                    </div>
                  </div>
                  <p className="text-indigo-100 mb-4 text-sm">
                    Browse our extensive library of courses created by education experts and industry professionals.
                  </p>
                  <Link 
                    to="/courses"
                    className="inline-flex items-center px-4 py-2 bg-white text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                  >
                    <FaGraduationCap className="mr-2" />
                    Browse Courses
                  </Link>
                </div>

              </section>

            </div>

            {/* Sidebar - Learning Analytics */}
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