import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaHome, FaGraduationCap, FaBrain, FaAward, FaUser, FaArrowLeft
} from 'react-icons/fa';

const MobileBottomNavigation = () => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to check if current path matches navigation item
  const isActive = (itemPath) => {
    if (itemPath === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(itemPath);
  };

  // Helper function to go back
  const goBack = () => {
    navigate(-1);
  };

  // Get navigation configuration based on current route
  const getNavigationConfig = () => {
    const path = location.pathname;

    // Course Detail Page (e.g., /courses/6th, /courses/engineering)
    if (path.match(/^\/courses\/[^\/]+$/) && path !== '/courses') {
      return {
        type: 'course-category',
        items: [
          { action: goBack, icon: FaArrowLeft, label: 'Back', isAction: true },
          { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/chat', icon: FaBrain, label: 'AI Help', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
        ]
      };
    }

    // Subject Detail Page (e.g., /courses/6th/cbse/math)
    if (path.match(/^\/courses\/[^\/]+\/[^\/]+\/[^\/]+$/)) {
      return {
        type: 'subject-detail',
        items: [
          { action: goBack, icon: FaArrowLeft, label: 'Back', isAction: true },
          { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/chat', icon: FaBrain, label: 'AI Help', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
        ]
      };
    }

    // Learning Page (e.g., /courses/6th/cbse/math/learning)
    if (path.includes('/learning')) {
      return {
        type: 'learning',
        items: [
          { action: goBack, icon: FaArrowLeft, label: 'Back', isAction: true },
          { path: '/chat', icon: FaBrain, label: 'AI Help', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
        ]
      };
    }

    // Courses Main Page
    if (path === '/courses') {
      return {
        type: 'courses-main',
        items: [
          { path: '/', icon: FaHome, label: 'Home', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/chat', icon: FaBrain, label: 'AI Chat', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
          { path: isLoggedIn ? '/profile' : '/auth?mode=login', icon: FaUser, label: isLoggedIn ? 'Profile' : 'Login', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
        ]
      };
    }

    // Profile Pages
    if (path.startsWith('/profile')) {
      return {
        type: 'profile',
        items: [
          { path: '/', icon: FaHome, label: 'Home', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/profile', icon: FaUser, label: 'Profile', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
        ]
      };
    }

    // Learning Hub Page
    if (path === '/learning-hub') {
      return {
        type: 'learning-hub',
        items: [
          { path: '/', icon: FaHome, label: 'Home', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/chat', icon: FaBrain, label: 'AI Chat', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/profile', icon: FaUser, label: 'Profile', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
        ]
      };
    }

    // Chat Page
    if (path === '/chat') {
      return {
        type: 'chat',
        items: [
          { path: '/', icon: FaHome, label: 'Home', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/chat', icon: FaBrain, label: 'AI Chat', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
          { path: isLoggedIn ? '/profile' : '/auth?mode=login', icon: FaUser, label: isLoggedIn ? 'Profile' : 'Login', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
        ]
      };
    }

    // Default Main Navigation (Home, Learning Hub, etc.)
    return {
      type: 'main',
      items: [
        { path: '/', icon: FaHome, label: 'Home', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
        { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
        { path: '/chat', icon: FaBrain, label: 'AI Chat', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
        ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
        { path: isLoggedIn ? '/profile' : '/auth?mode=login', icon: FaUser, label: isLoggedIn ? 'Profile' : 'Login', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
      ]
    };
  };

  const navConfig = getNavigationConfig();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      {/* Main Navigation Bar */}
      <div className="flex items-center justify-around px-2 py-1">
        {navConfig.items.map((item, index) => {
          const active = item.path ? isActive(item.path) : false;
          const isActionButton = item.isAction;
          
          if (isActionButton) {
            return (
              <button
                key={index}
                onClick={item.action}
                className={`flex flex-col items-center py-1 px-2 relative transition-all duration-200 rounded-lg hover:bg-gray-50 ${
                  item.label === 'Back' ? 'text-gray-600' : item.activeColor || 'text-gray-600'
                }`}
              >
                {/* Icon container */}
                <div className="p-1.5 rounded-lg transition-all duration-200">
                  <item.icon className="w-4 h-4" />
                </div>
                
                {/* Label */}
                <span className="text-xs font-medium mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link 
              key={index}
              to={item.path} 
              className={`flex flex-col items-center py-1 px-2 relative transition-all duration-200 rounded-lg ${
                active ? 'transform scale-105' : 'hover:bg-gray-50'
              }`}
            >
              {/* Icon container */}
              <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                active 
                  ? `${item.bgColor} ${item.activeColor}` 
                  : 'text-gray-500'
              }`}>
                <item.icon className="w-4 h-4" />
              </div>
              
              {/* Label */}
              <span className={`text-xs font-medium mt-0.5 transition-all duration-200 ${
                active 
                  ? `${item.activeColor} font-semibold` 
                  : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      
      {/* Safe area padding for newer phones - reduced */}
      <div className="h-0.5 sm:h-1" />
    </div>
  );
};

export default MobileBottomNavigation;
