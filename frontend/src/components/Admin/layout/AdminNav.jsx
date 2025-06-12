import React from 'react';
import { Link } from 'react-router-dom';
import { FaSignOutAlt, FaLock, FaBars } from 'react-icons/fa';

const AdminNav = ({ onLogout, isLoginPage, onMenuToggle }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and brand name */}
          <div className="flex items-center">
            {!isLoginPage && (
              <button
                onClick={onMenuToggle}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                aria-label="Toggle menu"
              >
                <FaBars className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            <Link to="/" className="flex items-center space-x-2 transition-transform hover:scale-[1.02]">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <span className="font-bold text-xl text-gray-800">
                Students Hub
              </span>
            </Link>
          </div>

          {/* Right side - Admin text and logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center text-gray-700">
              <FaLock className="mr-2 text-gray-700" />
              <span className="font-medium">
                Admin Portal
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center text-gray-700 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <FaSignOutAlt className="mr-1" />
                <span className="hidden sm:inline text-sm">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;