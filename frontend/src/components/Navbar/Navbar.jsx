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
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);  }, []);

  let backgroundClass = '';
  if (isScrolled) {
    backgroundClass = 'bg-white/95 backdrop-blur-md shadow-md';
  } else if (initialStyle === 'gradient') {
    backgroundClass = 'bg-gradient-to-r from-indigo-600 to-purple-700';
  } else if (initialStyle === 'light') {
    backgroundClass = 'bg-white shadow-sm';
  } else {
    // Transparent navbar for hero sections
    backgroundClass = 'bg-transparent';
  }

  const textColor = (isScrolled || initialStyle === 'light') 
    ? 'text-gray-700 hover:text-blue-600' 
    : 'text-white hover:text-blue-200';
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${backgroundClass} ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo section */}
          <div className="flex items-center w-[200px]">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
              <span className={`font-bold text-lg ${isScrolled || initialStyle === 'light' ? 'text-gray-800' : 'text-white'}`}>Students Hub</span>
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
                    text-blue-600 border border-blue-600 hover:bg-blue-50`}
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

            {/* Mobile profile button - Clean and professional */}
            {isLoggedIn ? (
              <button 
                className="md:hidden ml-4"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <div className={`w-8 h-8 rounded-full ${isScrolled || initialStyle === 'light' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/20 backdrop-blur-sm'} flex items-center justify-center`}>
                  <FaUserCircle className={`w-5 h-5 ${isScrolled || initialStyle === 'light' ? 'text-white' : 'text-white'}`} />
                </div>
              </button>
            ) : (
              <Link 
                to="/auth?mode=login"
                className={`md:hidden ml-4 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isScrolled || initialStyle === 'light' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
        
        {/* Mobile profile menu - Only profile-related options */}
        {isMobileMenuOpen && isLoggedIn && (
          <div className="md:hidden mt-4 py-3 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 mx-4">
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
        )}
      </div>
    </nav>
  );
};

export default Navbar;