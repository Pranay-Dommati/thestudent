import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaCog, FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ initialStyle = "transparent" }) => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  let backgroundClass = '';
  if (isScrolled) {
    backgroundClass = 'bg-white shadow-md';
  } else if (initialStyle === 'gradient') {
    backgroundClass = 'bg-gradient-to-r from-indigo-600 to-purple-700';
  } else if (initialStyle === 'light') {
    backgroundClass = 'bg-white shadow-sm';
  } else {
    backgroundClass = 'bg-transparent';
  }

  const textColor = (isScrolled || initialStyle === 'light') 
    ? 'text-gray-700 hover:text-blue-600' 
    : 'text-white hover:text-blue-200';

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileDropdownOpen(false);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${backgroundClass} ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo section */}
          <div className="flex items-center w-[200px]">
            <a href="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className={`font-bold text-xl ${isScrolled || initialStyle === 'light' ? 'text-gray-800' : 'text-white'}`}>Students Hub</span>
            </a>
          </div>
          
          {/* Center the navigation items */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-[600px]">
            <div className="flex items-center space-x-8">
              <a href="/" className={`font-medium transition-colors ${textColor}`}>Home</a>
              <a href="/courses" className={`font-medium transition-colors ${textColor}`}>Courses</a>
              <a href="/chat" className={`font-medium transition-colors ${textColor}`}>AI Chatbot</a>
              <a href="/learning-hub" className={`font-medium transition-colors ${textColor}`}>Learning Hub</a>
            </div>
          </div>
          
          {/* Profile section */}
          <div className="flex items-center justify-end w-[200px]">
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white cursor-pointer hover:opacity-90 transition-opacity">
                    <FaUserCircle className="w-6 h-6" />
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl border border-gray-100">
                    <Link to="/profile" className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100">
                      <FaUserCircle className="w-4 h-4 mr-2" />
                      <span>Profile</span>
                    </Link>
                    <Link to="/learning-hub" className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100">
                      <FaGraduationCap className="w-4 h-4 mr-2" />
                      <span>My Learning</span>
                    </Link>
                    <Link to="/settings" className="flex items-center px-4 py-2 text-gray-800 hover:bg-gray-100">
                      <FaCog className="w-4 h-4 mr-2" />
                      <span>Settings</span>
                    </Link>
                    <hr className="my-2" />
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      <FaSignOutAlt className="w-4 h-4 mr-2" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4"> {/* Added space-x-4 here */}
                <a href="/auth?mode=login" 
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 
                    ${isScrolled || initialStyle === 'light' 
                      ? 'text-blue-600 border border-blue-600 hover:bg-blue-50' 
                      : 'text-white border border-white hover:bg-white/20'}`}
                >
                  Log In
                </a>
                <Link 
                  to="/auth?mode=signup" 
                  className="px-4 py-2 rounded-full font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg transition-shadow"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isScrolled || initialStyle === 'light' ? 'text-gray-800' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <a href="/" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Home</a>
            <a href="/courses" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Courses</a>
            <a href="/chat" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">AI Chatbot</a>
            <a href="/learning-hub" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Learning Hub</a>
            {isLoggedIn ? (
              <>
                <hr className="my-2" />
                <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Profile</Link>
                <Link to="/learning-hub" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">My Learning</Link>
                <Link to="/settings" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Settings</Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="mt-4 flex flex-col space-y-2 px-4">
                <a href="/auth?mode=login" className="px-4 py-2 rounded-full text-blue-600 border border-blue-600 font-medium text-center">
                  Log In
                </a>
                <Link 
                  to="/auth?mode=signup" 
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;