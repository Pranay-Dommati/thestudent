import React from 'react';
import { Link } from 'react-router-dom';

const AdminNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and brand name */}
          <Link to="/" className="flex items-center space-x-2 transition-transform hover:scale-[1.02]">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <span className="font-bold text-xl text-gray-800">
              Students Hub
            </span>
          </Link>

          {/* Right side - Admin text */}
          <div className="flex items-center">
            <span className="font-medium text-gray-700">
              Admin Panel
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNav;