import React, { useState, useEffect, useCallback } from 'react';
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
import axios from '../../utils/axios';
// logger removed for production cleanliness

// Use backend via proxy; axios instance used within children where needed

const LearningHubPage = () => {
  const { user: authUser, isLoggedIn } = useAuth();
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
  const [learningStats, setLearningStats] = useState({
    weekly_hours: 0,
    current_streak: 0,
    today: { hours: 0 }
  });
  
  // Cleaned up development logs
  useEffect(() => {}, [learningStats]);
  
  const refreshHubData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      // Fetch enrolled courses count
      const coursesResponse = await axios.get('/courses/enrolled/');
      if (coursesResponse.data?.success) {
        setEnrolledCoursesCount(coursesResponse.data.courses.length);
      }

      // Fetch learning statistics
      const stats = await getLearningStats();
      if (stats) {
        setLearningStats(stats);
      }
    } catch (_) {
      // silent in production
    }
  }, [isLoggedIn]);

  useEffect(() => {
    refreshHubData();
  }, [refreshHubData]);

  // Lightweight realtime: listen for activity updates and pro-learning saves
  useEffect(() => {
    const onActivity = (e) => {
      // Optimistically update time-based stats without immediate network call
      const minutes = e?.detail?.minutes;
      if (typeof minutes === 'number' && minutes > 0) {
        let shouldRefreshForStreak = false;
        setLearningStats((prev) => {
          const prevWeek = Number(prev?.weekly_hours || 0);
          const prevTodayHours = Number(prev?.today?.hours || 0);
          const addHours = minutes / 60;

          // If this is the first activity chunk today, schedule a stats refresh to update streak from backend
          if (prevTodayHours === 0) {
            shouldRefreshForStreak = true;
          }

          // Update weekly breakdown marking today as active (for immediate UI feedback)
          const wb = Array.isArray(prev?.weekly_breakdown) ? [...prev.weekly_breakdown] : [];
          try {
            const todayISO = new Date().toISOString().slice(0, 10);
            const idx = wb.findIndex((d) => {
              const dateStr = typeof d?.date === 'string' ? d.date : (d?.date ? new Date(d.date).toISOString().slice(0,10) : null);
              return dateStr === todayISO;
            });
            if (idx >= 0) {
              const item = wb[idx] || {};
              const itemHours = Number(item.hours || 0) + addHours;
              const itemMinutes = Number(item.minutes || 0) + minutes;
              wb[idx] = { ...item, has_activity: true, hours: itemHours, minutes: itemMinutes };
            }
          } catch {}

          return {
            ...prev,
            weekly_hours: prevWeek + addHours,
            today: {
              ...(prev?.today || {}),
              hours: prevTodayHours + addHours,
            },
            weekly_breakdown: wb,
          };
        });

        // Fetch authoritative streak data once when today transitions from 0 -> active
        if (shouldRefreshForStreak) {
          refreshHubData();
        }
      } else {
        // For events without minutes detail, fallback to a refresh
        refreshHubData();
      }
    };
    const onStorage = (e) => {
      // If proLearning course saved markers changed, refresh enrolled/pro courses indirectly
      if (e && typeof e.key === 'string' && (e.key.startsWith('proLearning_') || e.key === 'coursesSavedToHub')) {
        refreshHubData();
      }
    };
    const onEnrollmentChanged = (e) => {
      // Prefer delta updates to avoid extra network call; fallback to full refresh
      const detail = e?.detail || {};
      if (typeof detail.count === 'number') {
        setEnrolledCoursesCount(Math.max(0, detail.count));
      } else if (typeof detail.delta === 'number') {
        setEnrolledCoursesCount((prev) => Math.max(0, prev + detail.delta));
      } else {
        refreshHubData();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshHubData();
      }
    };
    const onFocus = () => {
      // When tab/window gains focus, refresh once
      refreshHubData();
    };
    window.addEventListener('learning:activity-updated', onActivity);
    window.addEventListener('prolearning:course-saved', onActivity);
    window.addEventListener('enrollment-changed', onEnrollmentChanged);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('learning:activity-updated', onActivity);
      window.removeEventListener('prolearning:course-saved', onActivity);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('enrollment-changed', onEnrollmentChanged);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshHubData]);
  
  // Create user object with real learning statistics - ALWAYS use fresh data from API
  const user = {
    name: authUser?.full_name || authUser?.first_name || authUser?.username || "Student",
    totalCoursesEnrolled: enrolledCoursesCount,
    // FORCE real API data to override any dummy data
    hoursThisWeek: learningStats?.weekly_hours ?? 0,
    weeklyGoalHours: 15,
    currentStreak: learningStats?.current_streak ?? 0
  };

  

  return (
    <>
      <Navbar initialStyle="gradient" />
      <div className="learning-hub-container learning-hub-page min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/50 pt-16 relative">
        {/* Subtle background pattern - moved to after initial load */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Optimized CSS for smooth animations */}
        <style jsx>{`
          .learning-hub-page {
            animation: hubFadeIn 0.4s ease-out forwards;
          }
          
          @keyframes hubFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .hub-section {
            opacity: 0;
            animation: sectionSlide 0.3s ease-out forwards;
            will-change: opacity, transform;
          }
          
          @keyframes sectionSlide {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .hub-stagger-1 { animation-delay: 0.1s; }
          .hub-stagger-2 { animation-delay: 0.2s; }
          .hub-stagger-3 { animation-delay: 0.3s; }
          .hub-stagger-4 { animation-delay: 0.4s; }
          
          /* Simplified hover effects */
          .hub-hover {
            transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
          }
          
          .hub-hover:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }
          
          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .learning-hub-page,
            .hub-section {
              animation: none;
              opacity: 1;
              transform: none;
            }
          }
        `}</style>
  {/* Final user object logging removed for production */}
        
        {/* Hero Section - Force real learning stats */}
        <div className="hub-section">
          <HeroSection 
            user={{
              ...user,
              // EXPLICIT OVERRIDE: Use only real API data for learning stats
              hoursThisWeek: learningStats?.weekly_hours ?? 0,
              currentStreak: learningStats?.current_streak ?? 0
            }} 
          />
        </div>

        
        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* Main Learning Content */}
            <div className="xl:col-span-3 space-y-10">
              
              {/* Expert-Crafted Enrolled Courses Section */}
              <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hub-section hub-stagger-1 hub-hover">
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
                <ActiveCourses
                  onEnrollmentChanged={(change) => {
                    if (change && typeof change.count === 'number') {
                      setEnrolledCoursesCount(Math.max(0, change.count));
                    } else if (change && typeof change.delta === 'number') {
                      setEnrolledCoursesCount((prev) => Math.max(0, prev + change.delta));
                    } else {
                      refreshHubData();
                    }
                  }}
                />
              </section>
              
              {/* AI-Created Courses Section */}
              <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hub-section hub-stagger-2 hub-hover">
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
              
              {/* Certificates Section - Temporarily Hidden */}
              {/* <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
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
              </section> */}
              
              {/* Minimalistic Call-to-Action Buttons Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 learning-hub hub-section hub-stagger-3">
                
                {/* Create Custom Course with AI */}
                <div className="group bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 text-white hub-hover">
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
                        e.stopPropagation();
                      }}
                    >
                      Start
                    </Link>
                  </div>
                </div>

                {/* Explore Expert Courses */}
                <div className="group bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-5 text-white hub-hover">
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
            <div className="xl:col-span-1 hub-section hub-stagger-4">
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