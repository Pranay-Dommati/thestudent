import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaRocket, 
  FaBookOpen, 
  FaBrain, 
  FaChartLine, 
  FaGraduationCap,
  FaFire,
  FaCertificate
} from 'react-icons/fa';
import ActiveCourses from './ActiveCourses/ActiveCourses';
import AILearningPlans from './AILearningPlans/AILearningPlans';
import LearningAnalytics from './LearningAnalytics/LearningAnalytics';
import Certificates from '../Profile/tabs/Certificates';
import axios from '../../utils/axios';
import { getLearningStats as fetchLearningStats } from '../../services/activityTracker';
// logger removed for production cleanliness

// API base is provided via axios instance or fetch with relative paths

const MobileLearningHubPage = () => {
  const { user: authUser, isLoggedIn } = useAuth();
  const [learningStats, setLearningStats] = useState(null);
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
  const [activeTab, setActiveTab] = useState('enrolled'); // Tab state

  useEffect(() => {
    const refresh = async () => {
      if (!isLoggedIn) return;
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const [coursesResponse, stats] = await Promise.all([
          axios.get('/courses/enrolled/'),
          fetchLearningStats(),
        ]);
        if (coursesResponse.data?.success) {
          setEnrolledCoursesCount(coursesResponse.data.courses.length);
        }
        if (stats) {
          setLearningStats(stats);
        }
      } catch (_) {}
    };
    refresh();
  }, [isLoggedIn]);

  // Listen for global enrollment changes and refresh-on-focus for mobile
  useEffect(() => {
    const onEnrollmentChanged = (e) => {
      const detail = e?.detail || {};
      if (typeof detail.count === 'number') {
        setEnrolledCoursesCount(Math.max(0, detail.count));
      } else if (typeof detail.delta === 'number') {
        setEnrolledCoursesCount((prev) => Math.max(0, prev + detail.delta));
      } else {
        // Fallback: refetch count once
        axios.get('/courses/enrolled/').then((res) => {
          if (res.data?.success) {
            setEnrolledCoursesCount(res.data.courses.length);
          }
        }).catch(() => {});
      }
    };
    const onActivity = (e) => {
      const minutes = e?.detail?.minutes;
      if (typeof minutes === 'number' && minutes > 0) {
        let shouldRefreshForStreak = false;
        setLearningStats((prev) => {
          if (!prev) return prev;
          const prevWeek = Number(prev?.weekly_hours || 0);
          const prevTodayHours = Number(prev?.today?.hours || 0);
          const addHours = minutes / 60;
          if (prevTodayHours === 0) shouldRefreshForStreak = true;
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
            today: { ...(prev?.today || {}), hours: prevTodayHours + addHours },
            weekly_breakdown: wb,
          };
        });
        if (shouldRefreshForStreak) {
          fetchLearningStats().then((stats) => stats && setLearningStats(stats)).catch(() => {});
        }
      } else {
        fetchLearningStats().then((stats) => stats && setLearningStats(stats)).catch(() => {});
      }
    };
    const onStorage = (e) => {
      if (e && typeof e.key === 'string' && (e.key.startsWith('proLearning_') || e.key === 'coursesSavedToHub')) {
        fetchLearningStats().then((stats) => stats && setLearningStats(stats)).catch(() => {});
      }
    };
    const onProLearningSaved = () => {
      fetchLearningStats().then((stats) => stats && setLearningStats(stats)).catch(() => {});
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        axios.get('/courses/enrolled/').then((res) => {
          if (res.data?.success) {
            setEnrolledCoursesCount(res.data.courses.length);
          }
        }).catch(() => {});
        fetchLearningStats().then((stats) => stats && setLearningStats(stats)).catch(() => {});
      }
    };
    const onFocus = () => {
      axios.get('/courses/enrolled/').then((res) => {
        if (res.data?.success) {
          setEnrolledCoursesCount(res.data.courses.length);
        }
      }).catch(() => {});
      fetchLearningStats().then((stats) => stats && setLearningStats(stats)).catch(() => {});
    };
    window.addEventListener('enrollment-changed', onEnrollmentChanged);
    window.addEventListener('learning:activity-updated', onActivity);
    window.addEventListener('prolearning:course-saved', onProLearningSaved);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('enrollment-changed', onEnrollmentChanged);
      window.removeEventListener('learning:activity-updated', onActivity);
      window.removeEventListener('prolearning:course-saved', onProLearningSaved);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Create enhanced user object with updated stats
  const user = {
    ...authUser,
    totalCoursesEnrolled: enrolledCoursesCount,
    hoursThisWeek: learningStats?.weekly_hours || 0,
    currentStreak: learningStats?.current_streak || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-0 md:pt-6">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden pt-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="relative px-4 py-5 pt-[3.75rem]">
          {/* Welcome Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white mb-4"
          >
            <h1 className="text-xl font-bold mb-1">
              Welcome back, {user?.full_name || user?.first_name || user?.username || 'Student'}! 👋
            </h1>
            <p className="text-blue-100 text-sm">
              Ready to continue your learning journey?
            </p>
          </motion.div>

          {/* Quick Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2 mb-4"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
              <div className="text-xl font-bold text-white mb-0.5">
                {user?.totalCoursesEnrolled || 0}
              </div>
              <div className="text-xs text-blue-100">Enrolled</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
              <div className="text-xl font-bold text-white mb-0.5">
                {typeof user?.hoursThisWeek === 'number' ? user.hoursThisWeek.toFixed(1) : '0'}h
              </div>
              <div className="text-xs text-blue-100">This Week</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
              <div className="text-xl font-bold text-white mb-0.5 flex items-center justify-center">
                {user?.currentStreak || 0} <FaFire className="text-orange-400 ml-1 text-xs" />
              </div>
              <div className="text-xs text-blue-100">Day Streak</div>
            </div>
          </motion.div>

          {/* Quick Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-2"
          >
            <Link 
              to="/chat"
              className="bg-white text-indigo-700 font-semibold rounded-xl px-3 py-3 text-center flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm"
            >
              <FaRocket className="mr-1.5 text-base" />
              <span>Create Course</span>
            </Link>
            
            <Link 
              to="/courses"
              className="bg-indigo-500/20 backdrop-blur-sm text-white font-semibold rounded-xl px-3 py-3 text-center flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all active:scale-95 text-sm"
            >
              <FaBookOpen className="mr-1.5 text-base" />
              <span>Browse Courses</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Content Area - Tabbed Interface */}
      <div className="px-4 pt-6 pb-20">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-4 p-1">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'enrolled'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FaGraduationCap className="mx-auto mb-1 text-base" />
              <div className="text-xs">Enrolled</div>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ai'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FaBrain className="mx-auto mb-1 text-base" />
              <div className="text-xs">AI Courses</div>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FaChartLine className="mx-auto mb-1 text-base" />
              <div className="text-xs">Stats</div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'enrolled' && (
            <motion.div
              key="enrolled"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-indigo-500 p-2 rounded-lg mr-3">
                  <FaGraduationCap className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">My Enrolled Courses</h2>
                  <p className="text-xs text-gray-500">Continue your learning journey</p>
                </div>
              </div>
              <ActiveCourses
                onEnrollmentChanged={(change) => {
                  if (change && typeof change.count === 'number') {
                    setEnrolledCoursesCount(Math.max(0, change.count));
                  } else if (change && typeof change.delta === 'number') {
                    setEnrolledCoursesCount((prev) => Math.max(0, prev + change.delta));
                  } else {
                    axios.get('/courses/enrolled/').then((res) => {
                      if (res.data?.success) {
                        setEnrolledCoursesCount(res.data.courses.length);
                      }
                    }).catch(() => {});
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-500 p-2 rounded-lg mr-3">
                  <FaBrain className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">My AI-Created Courses</h2>
                  <p className="text-xs text-gray-500">AI-powered learning paths</p>
                </div>
              </div>
              <AILearningPlans />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <FaChartLine className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Learning Progress</h2>
                  <p className="text-xs text-gray-500">Track your growth and achievements</p>
                </div>
              </div>
              <LearningAnalytics 
                user={{
                  ...user,
                  weeklyBreakdown: learningStats?.weekly_breakdown ?? []
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileLearningHubPage;
