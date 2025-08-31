import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import { HiBookOpen } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ initialStyle = "transparent" }) => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  // Check if current route is a course level selection page (like /courses/6th, /courses/7th, etc.)
  // or a course board selection page (like /courses/6th/cbse, /courses/6th/state/ts)
  // but NOT a course detail page (like /courses/6th/cbse/telugu)
  const isCourseSelectionPage = location.pathname.match(/^\/courses\/(6th|7th|8th|9th|10th|11th|12th|engineering)$/) ||
                               (location.pathname.match(/^\/courses\/(6th|7th|8th|9th|10th|11th|12th|engineering)\/(cbse|state)/) && 
                                !location.pathname.match(/^\/courses\/(6th|7th|8th|9th|10th|11th|12th|engineering)\/(cbse|state\/[^/]+)\/[^/]+/));

  let backgroundClass = '';
  if (isScrolled) {
    backgroundClass = 'bg-white/95 backdrop-blur-md shadow-md';
  } else if (initialStyle === 'gradient') {
    backgroundClass = 'bg-gradient-to-r from-indigo-600 to-purple-700';
  } else if (initialStyle === 'light') {
    backgroundClass = 'bg-white shadow-sm';
  } else if (isMobile && isCourseSelectionPage) {
    // For mobile course selection pages only (not course detail pages), use light background for visibility
    backgroundClass = 'bg-white shadow-sm';
  } else {
    // Transparent navbar for hero sections
    backgroundClass = 'bg-transparent';
  }

  const textColor = (isScrolled || initialStyle === 'light' || (isMobile && isCourseSelectionPage)) 
    ? 'text-gray-700 hover:text-blue-600' 
    : 'text-white hover:text-blue-200';
  const handleLogout = () => {
    logout();
    navigate('/');
    closeAllMenus();
  };
  
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
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <HiBookOpen className="text-sm" />
              </div>
              <span className={`font-bold text-lg ${isScrolled || initialStyle === 'light' || (isMobile && isCourseSelectionPage) ? 'text-gray-800' : 'text-white'}`}>EasyLearnova</span>
            </Link>
          </div>
          
          {/* Center the navigation items */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-[600px]">
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
                AI Chatbot
              </Link>
              {/* Mentoring Link - commented out as requested */}
              {/* <Link 
                to="/mentoring" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Mentoring
              </Link> */}
            </div>
          </div>
          
          {/* Profile section - Add md:block to hide on mobile */}
          <div className="flex items-center justify-end w-[200px]">            {isLoggedIn ? (
              <div className="hidden md:flex">
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
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/auth?mode=login" 
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 
                    ${isScrolled || initialStyle === 'light' || (isMobile && isCourseSelectionPage) ? 'text-blue-600 border border-blue-600 hover:bg-blue-50' : 'text-white border border-white hover:bg-white/10'}`}
                >
                  Log In
                </Link>
                <Link 
                  to="/auth?mode=signup" 
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

            {/* Mobile profile button - Clean and professional */}
            {isLoggedIn ? (
              <button 
                className="md:hidden ml-4 menu-toggle-button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <div className={`w-8 h-8 rounded-full ${isScrolled || initialStyle === 'light' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/20 backdrop-blur-sm'} flex items-center justify-center`}>
                  <FaUserCircle className={`w-5 h-5 ${isScrolled || initialStyle === 'light' ? 'text-white' : 'text-white'}`} />
                </div>
              </button>
            ) : (
              <button 
                className="md:hidden ml-4 menu-toggle-button"
                onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
              >
                <div className={`w-8 h-8 rounded-full ${isScrolled || initialStyle === 'light' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/20 backdrop-blur-sm'} flex items-center justify-center`}>
                  <FaUserCircle className={`w-5 h-5 ${isScrolled || initialStyle === 'light' ? 'text-white' : 'text-white'}`} />
                </div>
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile profile menu - Only profile-related options */}
        {isMobileMenuOpen && isLoggedIn && (
          <>
            {/* Semi-transparent overlay for better UX */}
            <div 
              className="fixed inset-0 bg-black/30 z-40 md:hidden" 
              onClick={closeAllMenus}
            ></div>
            <div className="md:hidden mt-4 py-3 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 mx-4 navbar-menu z-50 relative">
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
        
        {/* Mobile auth menu - Login/Signup options */}
        {isAuthMenuOpen && !isLoggedIn && (
          <>
            {/* Semi-transparent overlay for better UX */}
            <div 
              className="fixed inset-0 bg-black/30 z-40 md:hidden" 
              onClick={closeAllMenus}
            ></div>
            <div className="md:hidden mt-4 py-3 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 mx-4 navbar-menu z-50 relative">
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
    </nav>
  );
};

export default Navbar;