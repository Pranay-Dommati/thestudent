import React from 'react';
import { Link } from 'react-router-dom';
import { FaSignOutAlt, FaLock, FaBars } from 'react-icons/fa';

const AdminNav = ({ onLogout, isLoginPage, isDarkMode }) => {
  return (    <nav className={`fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}>
      <div className="px-2 xs:px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left side - Logo and brand name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 transition-all hover:opacity-90">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm">
                S
              </div>
              <span className={`font-bold text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                EasyLearnova
              </span>
            </Link>          </div>

          {/* Right side - Admin text and logout */}
          <div className="flex items-center">
            <div className={`hidden sm:flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mr-2 xs:mr-4 sm:mr-6 py-1 sm:py-1.5 px-2 sm:px-3 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <FaLock className={`mr-1 sm:mr-2 text-xs sm:text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className="font-medium text-xs sm:text-sm">
                Admin Portal
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg ${isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                title="Logout"
              >
                <FaSignOutAlt className={`${isDarkMode ? 'text-red-400' : 'text-red-500'} text-xs sm:text-sm`} />
                <span className="hidden sm:inline text-xs sm:text-sm ml-2">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;