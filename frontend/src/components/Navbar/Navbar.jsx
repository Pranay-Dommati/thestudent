import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ initialStyle = "transparent" }) => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Check if we're on pages with hero sections
      const isHomePage = window.location.pathname === '/';
      const isCoursesPage = window.location.pathname.startsWith('/courses');
      
      if (isHomePage || isCoursesPage) {
        // On home page or courses page: change navbar to white when scrolling past the hero section
        const scrollThreshold = 100; // Adjust this value as needed
        setIsScrolled(window.scrollY > scrollThreshold);
      } else {
        // On other pages: change quickly
        setIsScrolled(window.scrollY > 10);
      }
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if we're on pages with hero sections
  const isHomePage = window.location.pathname === '/';
  const isCoursesPage = window.location.pathname.startsWith('/courses');
  
  let backgroundClass = '';
  let textClass = '';
  
  if (isScrolled) {
    // When scrolled: white background with dark text
    backgroundClass = 'bg-white shadow-lg';
    textClass = 'text-gray-800';
  } else if (initialStyle === 'gradient') {
    backgroundClass = 'bg-gradient-to-r from-indigo-600 to-purple-700';
    textClass = 'text-white';
  } else if (initialStyle === 'light') {
    backgroundClass = 'bg-white shadow-sm';
    textClass = 'text-gray-800';
  } else if (isHomePage || isCoursesPage) {
    // On home page or courses page when not scrolled: transparent with white text to blend with hero
    backgroundClass = 'bg-transparent';
    textClass = 'text-white';
  } else {
    // Other pages: default white background
    backgroundClass = 'bg-white shadow-sm';
    textClass = 'text-gray-800';
  }

  const linkHoverClass = isScrolled || (!isHomePage && !isCoursesPage) 
    ? 'hover:text-blue-600' 
    : 'hover:text-blue-200';
  
  const textColor = `${textClass} ${linkHoverClass} transition-colors duration-300`;
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ease-in-out ${backgroundClass} ${isScrolled ? 'py-2' : 'py-3'} hidden md:block`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo section */}
          <div className="flex items-center w-[200px]">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
              <span className={`font-bold text-lg ${textClass}`}>Students Hub</span>
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
                    ${isScrolled || (!isHomePage && !isCoursesPage)
                      ? 'text-blue-600 border border-blue-600 hover:bg-blue-50' 
                      : 'text-white border border-white hover:bg-white/10'}`}
                >
                  Log In
                </Link>
                <Link 
                  to="/auth?mode=signup" 
                  className="px-4 py-2 rounded-full font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-shadow"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button - Move to the right edge */}
            <button 
              className="md:hidden ml-4"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${textClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 bg-white rounded-lg shadow-xl">
            {isLoggedIn ? (
              <>
                <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  Profile
                </Link>
                <Link to="/" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  Home
                </Link>
                <Link to="/courses" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  Courses
                </Link>
                <Link to="/chat" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  AI Chatbot
                </Link>
                <Link to="/learning-hub" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                  Learning Hub
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100 mt-2 border-t border-gray-100"
                >
                  <FaSignOutAlt className="w-4 h-4 mr-2" />
                  <span>Sign Out</span>
                </button>
              </>            ) : (
              <>
                <Link to="/" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Home</Link>
                <Link to="/courses" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Courses</Link>
                <Link to="/chat" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">AI Chatbot</Link>
                <div className="mt-4 flex flex-col space-y-2 px-4">
                  <Link to="/auth?mode=login" className="px-4 py-2 rounded-full text-blue-600 border border-blue-600 font-medium text-center">
                    Log In
                  </Link>
                  <Link 
                    to="/auth?mode=signup" 
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;