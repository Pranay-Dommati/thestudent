import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BackButton = ({ title, subtitle, onBack }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6 md:mb-8">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 -mx-4 px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-3 shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => (onBack ? onBack() : navigate('/courses'))}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 text-gray-700 bg-white shadow-sm"
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft className="w-4 h-4" />
          </motion.button>
          <h1 className="text-base font-semibold text-gray-900 text-center flex-1 mx-3">{title}</h1>
          <div className="w-9" />
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2 text-center">{subtitle}</p>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center mb-4">
        <motion.button
          onClick={() => (onBack ? onBack() : navigate('/courses'))}
          className="mr-4 p-2.5 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default BackButton;