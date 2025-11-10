import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaUserPlus, FaSignInAlt, FaChevronRight, FaHome } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import LogoutConfirmModal from '../common/LogoutConfirmModal';

const Navbar = ({ initialStyle = "transparent" }) => {
  const { isLoggedIn, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { name: 'Home', path: '/', icon: <FaHome className="w-3 h-3" /> }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Create readable names for common segments
      let name = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === 'learning-hub') name = 'Learning Hub';
      if (segment === 'chat') name = 'Course Creator';
      if (segment === 'courses') name = 'Courses';
      if (segment === 'pro-learning') name = 'Pro Learning';
      if (segment === 'auth') name = 'Authentication';
      if (segment.includes('th') || segment === 'engineering') {
        name = segment.charAt(0).toUpperCase() + segment.slice(1);
      }
      
      breadcrumbs.push({
        name,
        path: currentPath,
        isLast: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  };

  // Mobile and tablet detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // Treat tablets as mobile for navigation
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle clicking outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen || isAuthMenuOpen) {
        // Check if click is outside the menus
        if (!event.target.closest('.navbar-menu') && 
            !event.target.closest('.menu-toggle-button')) {
          setIsMobileMenuOpen(false);
          setIsAuthMenuOpen(false);
        }
      }
    };
    
    // Handle ESC key press
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsAuthMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isMobileMenuOpen, isAuthMenuOpen]);

  // Determine if current route is a course selection page (grade/board/state pickers),
  // where the navbar should be solid (white) even at the top of the page.
  // Includes optional trailing slashes and excludes subject/detail pages.
  const selectionMatchers = [
    /^\/courses\/(6th|7th|8th|9th|10th|11th|12th|engineering)\/?$/,                 // /courses/10th[/]
    /^\/courses\/(6th|7th|8th|9th|10th|11th|12th|engineering)\/cbse\/?$/,          // /courses/10th/cbse[/]
    /^\/courses\/(6th|7th|8th|9th|10th|11th|12th|engineering)\/state\/?$/,         // /courses/10th/state[/]
    /^\/courses\/(6th|7th|8th|9th|10th|11th|12th|engineering)\/state\/[^/]+\/?$/   // /courses/7th/state/ap[/]
  ];
  const isCourseSelectionPage = selectionMatchers.some((rx) => rx.test(location.pathname));

  let backgroundClass = '';
  if (isScrolled) {
    backgroundClass = 'bg-white/95 backdrop-blur-md shadow-md';
  } else if (initialStyle === 'gradient') {
    backgroundClass = 'bg-gradient-to-r from-indigo-600 to-purple-700';
  } else if (initialStyle === 'light') {
    backgroundClass = 'bg-white shadow-sm';
  } else if (isMobile && isCourseSelectionPage) {
    // For course selection pages on mobile/tablet (grade/board/state), use light background for visibility.
    // Large desktop keeps the blended transparent navbar with the hero.
    backgroundClass = 'bg-white shadow-sm';
  } else {
    // Transparent navbar for hero sections
    backgroundClass = 'bg-transparent';
  }

  const textColor = (isScrolled || initialStyle === 'light' || (isMobile && isCourseSelectionPage)) 
    ? 'text-gray-700 hover:text-blue-600' 
    : 'text-white hover:text-blue-200';
  // Initiate logout with confirmation on mobile
  const handleLogout = () => {
    // Close the dropdown behind the modal for a cleaner UX
    setIsMobileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    try {
      logout();
    } finally {
      setShowLogoutConfirm(false);
      navigate('/');
      closeAllMenus();
    }
  };

  const cancelLogout = () => setShowLogoutConfirm(false);
  
  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsAuthMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${backgroundClass} ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo section */}
          <div className="flex items-center w-[200px]">
            <Link to="/" className="flex items-center">
              <h1 className={`font-bold text-xl tracking-wide transition-colors ${isScrolled || initialStyle === 'light' || (isMobile && isCourseSelectionPage) ? 'text-[#0A1A3F]' : 'text-white'}`}>
                EasyLearnova
              </h1>
            </Link>
          </div>
          
          {/* Navigation: Desktop = full nav, Tablet/Mobile = no breadcrumbs */}
          {isMobile ? (
            // Empty space for tablet and mobile - no breadcrumbs
            <div className="flex-1"></div>
          ) : loading ? (
            // Skeleton for desktop nav links while loading
            <div className="flex items-center justify-center flex-1 max-w-[600px]">
              <div className="flex items-center space-x-8">
                <div className={`h-5 w-12 rounded ${
                  isScrolled || initialStyle === 'light' 
                    ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100' 
                    : 'bg-gradient-to-r from-white/20 via-white/40 to-white/20'
                } relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${
                    isScrolled || initialStyle === 'light' 
                      ? 'bg-gradient-to-r from-transparent via-white/60 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-white/30 to-transparent'
                  } animate-shimmer`}></div>
                </div>
                <div className={`h-5 w-16 rounded ${
                  isScrolled || initialStyle === 'light' 
                    ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100' 
                    : 'bg-gradient-to-r from-white/20 via-white/40 to-white/20'
                } relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${
                    isScrolled || initialStyle === 'light' 
                      ? 'bg-gradient-to-r from-transparent via-white/60 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-white/30 to-transparent'
                  } animate-shimmer`}></div>
                </div>
                <div className={`h-5 w-24 rounded ${
                  isScrolled || initialStyle === 'light' 
                    ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100' 
                    : 'bg-gradient-to-r from-white/20 via-white/40 to-white/20'
                } relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${
                    isScrolled || initialStyle === 'light' 
                      ? 'bg-gradient-to-r from-transparent via-white/60 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-white/30 to-transparent'
                  } animate-shimmer`}></div>
                </div>
              </div>
            </div>
          ) : (
            // Full navigation for desktop
            <div className="flex items-center justify-center flex-1 max-w-[600px]">
              <div className="flex items-center space-x-8">
                <Link to="/" className={`font-medium transition-colors ${textColor}`}>Home</Link>
                <Link 
                  to="/courses" 
                  className={`font-medium transition-colors ${textColor}`}
                >
                  Courses
                </Link>
                {isLoggedIn && (
                  <Link 
                    to="/learning-hub" 
                    className={`font-medium transition-colors ${textColor}`}
                  >
                    Learning Hub
                  </Link>
                )}
                <Link 
                  to="/chat" 
                  className={`font-medium transition-colors ${textColor}`}
                >
                  Course Creator
                </Link>
              </div>
            </div>
          )}
          
          {/* Profile section - Hide on tablet/mobile, show on desktop */}
          <div className="flex items-center justify-end w-[200px]">
            {loading ? (
              // Skeleton for desktop auth buttons while loading
              <div className="hidden xl:flex items-center space-x-4">
                {/* Login button skeleton */}
                <div className={`h-10 w-20 rounded-full border ${
                  isScrolled || initialStyle === 'light' 
                    ? 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 border-gray-200' 
                    : 'bg-gradient-to-r from-white/20 via-white/40 to-white/20 border-white/30'
                } relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${
                    isScrolled || initialStyle === 'light' 
                      ? 'bg-gradient-to-r from-transparent via-white/60 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-white/30 to-transparent'
                  } animate-shimmer`}></div>
                </div>
                {/* Sign Up button skeleton */}
                <div className={`h-10 w-24 rounded-full ${
                  isScrolled || initialStyle === 'light' 
                    ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400' 
                    : 'bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400'
                } relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${
                    isScrolled || initialStyle === 'light' 
                      ? 'bg-gradient-to-r from-transparent via-white/30 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
                  } animate-shimmer`}></div>
                </div>
              </div>
            ) : isLoggedIn ? (
              <div className="hidden xl:flex">
                <Link 
                  to="/profile"
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white cursor-pointer hover:opacity-90 transition-opacity">
                    <FaUserCircle className="w-6 h-6" />
                  </div>
                </Link>
              </div>
            ) : (
              <div className="hidden xl:flex items-center space-x-4">
                <Link to={`/auth?mode=login&returnTo=${encodeURIComponent(location.pathname + (location.search || '') + (location.hash || ''))}`}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 
                    ${isScrolled || initialStyle === 'light' || (isMobile && isCourseSelectionPage) ? 'text-blue-600 border border-blue-600 hover:bg-blue-50' : 'text-white border border-white hover:bg-white/10'}`}
                >
                  Log In
                </Link>
                <Link 
                  to={`/auth?mode=signup&returnTo=${encodeURIComponent(location.pathname + (location.search || '') + (location.hash || ''))}`}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    isScrolled || initialStyle === 'light' || (isMobile && isCourseSelectionPage) 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg'
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile/Tablet profile button - Clean and professional */}
            {loading ? (
              // Skeleton loader while checking auth state on mobile
              <div className="xl:hidden ml-4 flex items-center">
                <div className={`w-8 h-8 rounded-full ${
                  isScrolled || initialStyle === 'light' 
                    ? 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200' 
                    : 'bg-gradient-to-r from-white/30 via-white/50 to-white/30'
                } relative overflow-hidden`}>
                  {/* Shimmer effect */}
                  <div className={`absolute inset-0 ${
                    isScrolled || initialStyle === 'light' 
                      ? 'bg-gradient-to-r from-transparent via-white/60 to-transparent' 
                      : 'bg-gradient-to-r from-transparent via-white/40 to-transparent'
                  } animate-shimmer`}></div>
                </div>
              </div>
            ) : isLoggedIn ? (
              <button 
                className="xl:hidden ml-4 menu-toggle-button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <div className={`w-8 h-8 rounded-full ${isScrolled || initialStyle === 'light' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/20 backdrop-blur-sm'} flex items-center justify-center`}>
                  <FaUserCircle className={`w-5 h-5 ${isScrolled || initialStyle === 'light' ? 'text-white' : 'text-white'}`} />
                </div>
              </button>
            ) : (
              <Link 
                to={`/auth?mode=login&returnTo=${encodeURIComponent(location.pathname + (location.search || '') + (location.hash || ''))}`}
                className="xl:hidden ml-4 flex items-center"
              >
                <div className={`px-3 py-1.5 rounded-full ${
                  isScrolled || initialStyle === 'light' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white text-blue-600 hover:bg-gray-50'
                } transition-all duration-300 shadow-sm flex items-center justify-center`}>
                  <span className="text-sm font-medium">Login</span>
                </div>
              </Link>
            )}
          </div>
        </div>
        
        {/* Mobile/Tablet profile menu - Only profile-related options */}
        {isMobileMenuOpen && isLoggedIn && (
          <>
            {/* Semi-transparent overlay for better UX */}
            <div 
              className="fixed inset-0 bg-black/30 z-40 xl:hidden" 
              onClick={closeAllMenus}
            ></div>
            <div className="xl:hidden mt-4 py-3 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 mx-4 navbar-menu z-50 relative">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Profile Options</p>
              </div>
            <Link 
              to="/profile" 
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FaUserCircle className="w-4 h-4 mr-3 text-gray-500" />
              <span>View Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt className="w-4 h-4 mr-3" />
              <span>Sign Out</span>
            </button>
          </div>
          </>
        )}
        
        {/* Mobile/Tablet auth menu - Login/Signup options */}
        {isAuthMenuOpen && !isLoggedIn && (
          <>
            {/* Semi-transparent overlay for better UX */}
            <div 
              className="fixed inset-0 bg-black/30 z-40 xl:hidden" 
              onClick={closeAllMenus}
            ></div>
            <div className="xl:hidden mt-4 py-3 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 mx-4 navbar-menu z-50 relative">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Account Options</p>
              </div>
            <Link 
              to="/auth?mode=login" 
              className="flex items-center px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={() => setIsAuthMenuOpen(false)}
            >
              <FaSignInAlt className="w-4 h-4 mr-3" />
              <span>Log In</span>
            </Link>
            <Link
              to="/auth?mode=signup"
              className="flex items-center px-4 py-3 text-indigo-600 hover:bg-indigo-50 transition-colors"
              onClick={() => setIsAuthMenuOpen(false)}
            >
              <FaUserPlus className="w-4 h-4 mr-3" />
              <span>Sign Up</span>
            </Link>
          </div>
          </>
        )}
      </div>
      
      {/* Shared Logout Confirmation Modal */}
      <LogoutConfirmModal 
        isOpen={showLogoutConfirm}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </nav>
  );
};

export default Navbar;