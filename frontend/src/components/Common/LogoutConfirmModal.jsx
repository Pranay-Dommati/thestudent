import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { FaSignOutAlt } from 'react-icons/fa';

/**
 * Shared Logout Confirmation Modal
 * Used across Navbar menu and Profile page for consistent UX
 */
const LogoutConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
  // Lock background scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow || '';
    };
  }, [isOpen]);

  // Render nothing if not in a browser (safety)
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999]"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onCancel}
            aria-hidden="true"
          />
          {/* Centered modal with safe area padding and internal scrolling if needed */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-title"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FaSignOutAlt className="h-6 w-6 text-red-600" />
                </div>
                <h3 id="logout-title" className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Sign Out
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to sign out? You'll need to sign in again to access your account.
                </p>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConfirm}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Sign Out
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LogoutConfirmModal;
