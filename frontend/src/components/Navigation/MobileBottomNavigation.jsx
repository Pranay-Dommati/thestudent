import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaHome, FaGraduationCap, FaBook, FaAward, FaCode, FaArrowLeft
} from 'react-icons/fa';
import { HiOutlineCode, HiOutlineSparkles } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';

const MobileBottomNavigation = () => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Hide bottom nav on specific routes (e.g., auth recovery flows)
  const hideNav = location.pathname === '/forgot-password';
  
  // State for controlling navigation visibility
  const [isVisible, setIsVisible] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollTimeoutRef = useRef(null);
  const lastToggleTime = useRef(0);

  // Set initial html class on mount (mobile + tablet)
  useEffect(() => {
    const rootElement = document.documentElement;
    const isMobileOrTablet = window.innerWidth < 1024;
    if (hideNav) {
      // Ensure classes are cleared when nav is hidden
      rootElement.classList.remove('mobile-nav-visible', 'mobile-nav-hidden');
    } else if (isMobileOrTablet) {
      rootElement.classList.add('mobile-nav-visible');
    } else {
      rootElement.classList.remove('mobile-nav-visible', 'mobile-nav-hidden');
    }
    
    return () => {
      rootElement.classList.remove('mobile-nav-visible', 'mobile-nav-hidden');
    };
  }, [hideNav]);

  // Scroll detection effect (mobile + tablet)
  useEffect(() => {
    // Skip on desktop only
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const rootElement = document.documentElement;
      rootElement.classList.remove('mobile-nav-visible', 'mobile-nav-hidden');
      return;
    }

    // Skip all scroll handling when nav is hidden
    if (hideNav) {
      const rootElement = document.documentElement;
      rootElement.classList.remove('mobile-nav-visible', 'mobile-nav-hidden');
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDifference = Math.abs(currentScrollY - lastScrollY);
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          const isNearBottom = (currentScrollY + windowHeight) >= (documentHeight - 100);
          const now = Date.now();
          const timeSinceLastToggle = now - lastToggleTime.current;
          
          // Prevent rapid toggling with minimum 300ms between visibility changes
          const canToggle = timeSinceLastToggle > 300;
          
          // Only react to significant scroll movements (threshold: 10px for better stability)
          if (scrollDifference > 10 && canToggle) {
            // If user is near the top (< 50px), always show navigation
            if (currentScrollY < 50) {
              if (!isVisible) {
                setIsVisible(true);
                lastToggleTime.current = now;
              }
            }
            // If near bottom, always show navigation to avoid glitching
            else if (isNearBottom) {
              if (!isVisible) {
                setIsVisible(true);
                lastToggleTime.current = now;
              }
            }
            // Normal scroll behavior in the middle of the page
            else if (currentScrollY > lastScrollY && currentScrollY > 100) {
              // Scrolling down & past 100px - hide navigation
              if (isVisible) {
                setIsVisible(false);
                lastToggleTime.current = now;
              }
            } else if (currentScrollY < lastScrollY) {
              // Scrolling up - show navigation
              if (!isVisible) {
                setIsVisible(true);
                lastToggleTime.current = now;
              }
            }
            
            setLastScrollY(currentScrollY);
          }
          
          // Clear any existing timeout
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          
          // Set timeout to show navigation after 3 seconds of no scrolling (increased for stability)
          scrollTimeoutRef.current = setTimeout(() => {
            if (!isVisible) {
              setIsVisible(true);
              lastToggleTime.current = Date.now();
            }
          }, 3000);
          
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [lastScrollY, hideNav]);

  // Dynamic padding based on navigation visibility (mobile + tablet)
  useEffect(() => {
    const rootElement = document.documentElement;
    const isMobileOrTablet = window.innerWidth < 1024;
    if (hideNav) {
      rootElement.classList.remove('mobile-nav-visible', 'mobile-nav-hidden');
    } else if (isMobileOrTablet) {
      if (isVisible) {
        rootElement.classList.add('mobile-nav-visible');
        rootElement.classList.remove('mobile-nav-hidden');
      } else {
        rootElement.classList.add('mobile-nav-hidden');
        rootElement.classList.remove('mobile-nav-visible');
      }
    } else {
      rootElement.classList.remove('mobile-nav-visible', 'mobile-nav-hidden');
    }
    
    // Cleanup on unmount
    return () => {
      rootElement.classList.remove('mobile-nav-visible', 'mobile-nav-hidden');
    };
  }, [isVisible, hideNav]);

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
          { path: '/chat', icon: FaBook, label: 'Creator', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
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
          { path: '/chat', icon: FaBook, label: 'Creator', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
        ]
      };
    }

    // Learning Page (e.g., /courses/6th/cbse/math/learning)
    // Use precise match to avoid catching "/learning-hub"
    const isCourseLearning = /^\/courses\/.+\/learning(\/|$)/.test(path);
    if (isCourseLearning) {
      return {
        type: 'learning',
        items: [
          { action: goBack, icon: FaArrowLeft, label: 'Back', isAction: true },
          { path: '/chat', icon: FaBook, label: 'Creator', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
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
          { path: '/chat', icon: FaBook, label: 'Creator', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
          { action: () => setShowComingSoon(true), icon: FaCode, label: 'Code', isAction: true, activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
        ]
      };
    }

    // Profile Pages - use same items/order as home page
    if (path.startsWith('/profile')) {
      return {
        type: 'main',
        items: [
          { path: '/', icon: FaHome, label: 'Home', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/chat', icon: FaBook, label: 'Creator', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
          { action: () => setShowComingSoon(true), icon: FaCode, label: 'Code', isAction: true, activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
        ]
      };
    }

    // Learning Hub Page - use same navigation as home page
    if (path === '/learning-hub') {
      return {
        type: 'main',
        items: [
          { path: '/', icon: FaHome, label: 'Home', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          { path: '/chat', icon: FaBook, label: 'Creator', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
          { action: () => setShowComingSoon(true), icon: FaCode, label: 'Code', isAction: true, activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
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
          { path: '/chat', icon: FaBook, label: 'Creator', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
          ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
          { action: () => setShowComingSoon(true), icon: FaCode, label: 'Code', isAction: true, activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
        ]
      };
    }

    // Default Main Navigation (Home, Learning Hub, etc.)
    return {
      type: 'main',
      items: [
        { path: '/', icon: FaHome, label: 'Home', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
        { path: '/courses', icon: FaGraduationCap, label: 'Courses', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
        { path: '/chat', icon: FaBook, label: 'Creator', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' },
        ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub', activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }] : []),
        { action: () => setShowComingSoon(true), icon: FaCode, label: 'Code', isAction: true, activeColor: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600' }
      ]
    };
  };

  const navConfig = getNavigationConfig();

  if (hideNav) {
    return null;
  }

  return (
    <>
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        // Add backdrop blur for better visual separation
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)'
      }}
    >
      {/* Main Navigation Bar */}
      <div className="flex items-center justify-around px-2 py-0.5 relative">
        {/* Add subtle gradient overlay for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
        
        {navConfig.items.map((item, index) => {
          const active = item.path ? isActive(item.path) : false;
          const isActionButton = item.isAction;
          
          if (isActionButton) {
            return (
              <button
                key={index}
                onClick={item.action}
                className="flex flex-col items-center py-0.5 px-2 relative transition-all duration-300 rounded-lg hover:bg-gray-50 active:scale-95"
              >
                {/* Icon container with enhanced animation */}
                <div className="p-1.5 rounded-lg transition-all duration-300 text-gray-500 hover:bg-gray-100">
                  <item.icon className="w-4 h-4 transition-transform duration-200 hover:scale-110" />
                </div>
                
                {/* Label */}
                <span className="text-xs font-medium mt-0.5 text-gray-500">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link 
              key={index}
              to={item.path} 
              className={`flex flex-col items-center py-0.5 px-2 relative transition-all duration-300 rounded-lg active:scale-95 ${
                active ? 'transform scale-105' : 'hover:bg-gray-50'
              }`}
            >
              {/* Icon container with enhanced animations */}
              <div className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                active 
                  ? `${item.bgColor} ${item.activeColor} shadow-md` 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}>
                <item.icon className="w-4 h-4 transition-transform duration-200" />
              </div>
              
              {/* Label with enhanced styling */}
              <span className={`text-xs font-medium mt-0.5 transition-all duration-300 ${
                active 
                  ? `${item.activeColor} font-semibold drop-shadow-sm` 
                  : 'text-gray-500 group-hover:text-gray-700'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>

    {/* Code Visualizer Coming Soon Modal - Rendered via Portal to body */}
    {showComingSoon && ReactDOM.createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowComingSoon(false)}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-gray-100">
          {/* Close button */}
          <button
            onClick={() => setShowComingSoon(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <HiOutlineCode className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <HiOutlineSparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
            Code Visualizer
          </h2>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-full">
              Coming Soon
            </span>
          </div>
          <p className="text-gray-600 text-center text-sm mb-4 leading-relaxed">
            AI-powered code visualization with step-by-step execution and voice explanations.
          </p>

          {/* Features preview */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full"></div>
              <span className="text-xs">Step-by-step code execution</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <span className="text-xs">AI voice explanations</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span className="text-xs">Interactive visualizations</span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => setShowComingSoon(false)}
            className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-sm"
          >
            Got it!
          </button>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default MobileBottomNavigation;
