import React from 'react';
import { createPortal } from 'react-dom';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const ModalTest = () => {
  // Exact same modal from ProLearningPage freemium feature
  const modalContent = (
    <div className="freemium-modal modal-portal animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 sm:p-8 animate-scaleIn max-h-[90vh] overflow-y-auto relative z-[10001]">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <IoCheckmarkCircle className="text-white" size={48} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
          Your Learning Path Starts Here
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 text-sm mb-4">
          Sign in to unlock a personalized and enhanced learning experience.
        </p>

        {/* Benefits List */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-sm text-gray-700">Seamless progress tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-sm text-gray-700">One-click access from your Learning Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-sm text-gray-700">Premium academic content curated for you</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Link
            to={`/auth?mode=signup&returnTo=${encodeURIComponent('/chat')}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Course
          </Link>
          <Link
            to={`/auth?mode=login&returnTo=${encodeURIComponent('/chat')}`}
            className="w-full flex items-center justify-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors text-sm"
          >
            Already have an account?
          </Link>
          <button
            onClick={() => {
              window.location.href = '/home-original';
            }}
            className="w-full px-4 py-1.5 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors"
          >
            Continue without saving
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {createPortal(modalContent, document.body)}
    </div>
  );
};

export default ModalTest;
