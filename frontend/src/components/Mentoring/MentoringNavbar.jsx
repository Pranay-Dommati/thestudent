import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap } from 'react-icons/fa';

export default function MentoringNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Website Name */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <span className={`font-bold text-xl ${
              isScrolled ? 'text-gray-800' : 'text-white'
            }`}>Students Hub</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/mentoring/browse" 
              className={`transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
              }`}
            >
              Browse Mentors
            </Link>
            <Link 
              to="/mentoring/communities" 
              className={`transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
              }`}
            >
              Communities
            </Link>
            <Link 
              to="/mentoring/how-it-works" 
              className={`transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
              }`}
            >
              How It Works
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <button className={`px-4 py-2 rounded-lg transition-colors ${
              isScrolled 
                ? 'text-blue-600 hover:bg-blue-50' 
                : 'text-white border border-white/30 hover:bg-white/10'
            }`}>
              Become a Mentor
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Find Mentor
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}