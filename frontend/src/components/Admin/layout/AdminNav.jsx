import React from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaUserCircle, FaMoon, FaSun, FaSignOutAlt } from 'react-icons/fa';

const AdminNav = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
    } shadow-md`}>
      <div className="px-4 h-16 flex items-center justify-between">
        <Link to="/admin" className="flex items-center space-x-3">
          <span className="text-xl font-bold">Admin Panel</span>
        </Link>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isDarkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
          </button>
          
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <FaBell />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="relative group">
            <button className="flex items-center space-x-2">
              <FaUserCircle className="w-8 h-8" />
              <span className="font-medium">Admin</span>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl hidden group-hover:block">
              <Link to="/admin/profile" className="px-4 py-2 hover:bg-gray-100 flex items-center">
                <FaUserCircle className="mr-2" /> Profile
              </Link>
              <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-600">
                <FaSignOutAlt className="mr-2" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;