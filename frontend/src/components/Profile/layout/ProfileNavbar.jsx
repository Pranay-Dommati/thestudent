import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGraduationCap, FaCog, FaSignOutAlt, FaBell, 
  FaUserCircle, FaShieldAlt, FaHistory, FaDownload 
} from 'react-icons/fa';

const ProfileNavbar = ({ isDarkMode, profileData, setActiveTab }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const profileActions = [
    { icon: FaUserCircle, label: 'View Profile', action: () => {} },
    { icon: FaShieldAlt, label: 'Privacy Settings', action: () => {} },
    { icon: FaHistory, label: 'Activity Log', action: () => {} },
    { icon: FaDownload, label: 'Download Data', action: () => {} },
    { icon: FaSignOutAlt, label: 'Sign Out', action: () => {}, className: 'text-red-500' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${
      isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    } border-b shadow-sm`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo with Back Button */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/"
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              ← Back
            </Link>
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Students Hub</span>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`p-2 rounded-full ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <div className="relative">
                  <FaBell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    2
                  </span>
                </div>
              </button>
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-500">
                  <img
                    src={profileData.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`hidden md:block font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {profileData.name}
                </span>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    } ring-1 ring-black ring-opacity-5`}
                  >
                    <div className="py-2">
                      {profileActions.map(({ icon: Icon, label, action, className }) => (
                        <button
                          key={label}
                          onClick={() => {
                            action();
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-sm flex items-center space-x-2 ${
                            className || (isDarkMode 
                              ? 'text-gray-300 hover:bg-gray-700' 
                              : 'text-gray-700 hover:bg-gray-100')
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ProfileNavbar;