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
import axios from 'axios';
// logger removed for production cleanliness

// API base is provided via axios instance or fetch with relative paths

const MobileLearningHubPage = () => {
  const { user: authUser, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('enrolled');
  const [learningStats, setLearningStats] = useState(null);
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);

  const tabs = [
    { 
      id: 'enrolled', 
      label: 'My Courses', 
      icon: FaGraduationCap,
      description: 'Continue your learning'
    },
    { 
      id: 'certificates', 
      label: 'Certificates', 
      icon: FaCertificate,
      description: 'Your achievements'
    },
    { 
      id: 'ai', 
      label: 'AI Courses', 
      icon: FaBrain,
      description: 'AI-powered learning'
    },
    { 
      id: 'analytics', 
      label: 'Progress', 
      icon: FaChartLine,
      description: 'Track your growth'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn) return;
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

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
        const response = await axios.get(`${API_URL}/api/learning/analytics/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          setLearningStats(response.data.analytics);
        }
      } catch (error) {
        // suppress logs in production
      }
    };

    fetchData();
  }, [isLoggedIn]);

  // Create enhanced user object with updated stats
  const user = {
    ...authUser,
    totalCoursesEnrolled: enrolledCoursesCount,
    hoursThisWeek: learningStats?.weekly_hours || 0,
    currentStreak: learningStats?.current_streak || 0
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'enrolled':
        return <ActiveCourses />;
      case 'certificates':
        return <Certificates />;
      case 'ai':
        return <AILearningPlans />;
      case 'analytics':
        return (
          <LearningAnalytics 
            user={{
              ...user,
              weeklyBreakdown: learningStats?.weekly_breakdown ?? []
            }} 
          />
        );
      default:
        return <ActiveCourses />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden pt-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="relative px-4 py-5">
          {/* Welcome Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white mb-4"
          >
            <h1 className="text-xl font-bold mb-1">
              Welcome back, {user?.firstName || 'Student'}! 👋
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

      {/* Tab Navigation */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-white rounded-2xl p-1.5 shadow-lg border border-gray-200">
          <div className="grid grid-cols-4 gap-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-3 px-2 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 active:scale-95'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-indigo-500 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10 text-center">
                    <Icon className={`text-lg mb-1 mx-auto ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                    <div className={`text-xs font-semibold leading-tight ${isActive ? 'text-white' : 'text-gray-700'}`}>
                      {tab.label}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area with Animation */}
      <div className="px-4 pt-2 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileLearningHubPage;
