import React from 'react';
import { Link } from 'react-router-dom';
import { FaSignOutAlt, FaLock, FaBars } from 'react-icons/fa';

const AdminNav = ({ onLogout, isLoginPage, onMenuToggle, isDarkMode }) => {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}>
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and brand name */}
          <div className="flex items-center">
            {!isLoginPage && (
              <button
                onClick={onMenuToggle}
                className={`mr-4 p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} lg:hidden transition-colors`}
                aria-label="Toggle menu"
              >
                <FaBars className="w-5 h-5" />
              </button>
            )}
            
            <Link to="/" className="flex items-center space-x-3 transition-all hover:opacity-90">
              <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                S
              </div>
              <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Students Hub
              </span>
            </Link>          </div>

          {/* Right side - Admin text and logout */}
          <div className="flex items-center">
            <div className={`hidden sm:flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mr-6 py-1.5 px-3 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <FaLock className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className="font-medium text-sm">
                Admin Portal
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className={`flex items-center px-3 py-1.5 rounded-lg ${isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                title="Logout"
              >
                <FaSignOutAlt className={`${isDarkMode ? 'text-red-400' : 'text-red-500'} text-sm`} />
                <span className="hidden sm:inline text-sm ml-2">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;