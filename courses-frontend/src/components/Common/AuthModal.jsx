import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoLockClosedOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose, title, message, feature }) => {
  const navigate = useNavigate();

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSignIn = () => {
    onClose();
    navigate('/auth?mode=login&returnTo=' + encodeURIComponent(window.location.pathname + window.location.search));
  };

  const handleSignUp = () => {
    onClose();
    navigate('/auth?mode=signup&returnTo=' + encodeURIComponent(window.location.pathname + window.location.search));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          {/* Enhanced Blurred Background */}
          <motion.div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Professional Modal Card */}
          <motion.div
            className="relative bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 400,
              duration: 0.3 
            }}
          >
            {/* Subtle gradient header */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

            {/* Close Button - Smaller and more refined */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg bg-gray-100/80 hover:bg-gray-200/80 transition-colors z-10 group"
              aria-label="Close modal"
            >
              <IoClose className="text-base text-gray-600 group-hover:text-gray-800" />
            </button>

            {/* Content */}
            <div className="px-8 pt-12 pb-8 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <IoLockClosedOutline className="text-2xl text-blue-600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
                Authentication Required
              </h2>
              
              {/* Description */}
              <p className="text-gray-600 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                Sign in to unlock course creation and save your learning progress
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  onClick={handleSignIn}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ y: 0, scale: 0.98 }}
                >
                  Sign In
                </motion.button>
                
                <motion.button
                  onClick={handleSignUp}
                  className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ y: 0, scale: 0.98 }}
                >
                  Create Account
                </motion.button>
              </div>

              {/* Footer note */}
              <p className="text-xs text-gray-500 mt-6">
                Free to join • Secure authentication
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
