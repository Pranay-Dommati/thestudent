import React from 'react';
import { Link } from 'react-router-dom';

const AuthNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center group">
            <h1 className="font-bold text-xl tracking-wide text-[#0A1A3F] transition-opacity group-hover:opacity-80">
              EasyLearnova
            </h1>
          </Link>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/"
              className="text-gray-600 hover:text-blue-600 transition-colors flex items-center group"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1.5 transition-transform group-hover:-translate-x-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthNav;