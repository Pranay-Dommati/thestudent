import React from 'react';
import { Link } from 'react-router-dom';

const AuthFooter = () => {
  return (
    <footer className="relative mt-auto bg-white/80 backdrop-blur-sm border-t border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Left side - Links */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link to="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-blue-600 transition-colors">
              Terms of Service
            </Link>
            <Link to="/feedback" className="hover:text-blue-600 transition-colors">
              Feedback
            </Link>
          </div>

          {/* Right side - Copyright */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>© {new Date().getFullYear()} EasyLearnova.</span>
            <span className="hidden sm:inline">All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;