/**
 * LoadingComponent.jsx
 * 
 * Enhanced loading component with batch generation progress support
 * for the ProLearning feature.
 * 
 * Extracted from ProLearningPage.jsx for better code organization and modularity.
 */

import React from 'react';
import { BiLoaderAlt } from 'react-icons/bi';
import { FaBookOpen, FaBrain, FaVideo, FaQuestionCircle } from 'react-icons/fa';

/**
 * Loading component with batch generation support
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isBatchGenerating - Whether batch generation is in progress
 * @param {number} props.batchGenerationProgress - Progress percentage (0-100)
 * @param {string} props.batchGenerationStatus - Status message for batch generation
 * @param {string} props.loadingStep - Current loading step message
 */
const LoadingComponent = ({
  isBatchGenerating = false,
  batchGenerationProgress = 0,
  batchGenerationStatus = '',
  loadingStep = ''
}) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-3 sm:p-4">
    <div className="w-full max-w-xs sm:max-w-md">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-4 sm:p-8 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 opacity-50"></div>
        
        {/* Main loading icon */}
        <div className="relative z-10 mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
            <BiLoaderAlt className="text-xl sm:text-2xl text-white animate-spin" />
          </div>
          {/* Floating particles */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>

        {/* Progress section for batch generation */}
        {isBatchGenerating && (
          <div className="mb-4 sm:mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2 sm:mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                style={{ width: `${batchGenerationProgress}%` }}
              ></div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mb-2">
              {batchGenerationProgress}% Complete
            </div>
          </div>
        )}

        {/* Status messages */}
        <div className="relative z-10 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
            {isBatchGenerating ? '🚀 Generating Your Course' : 'Preparing Content'}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            {isBatchGenerating ? batchGenerationStatus : (loadingStep || 'Setting up your learning materials...')}
          </p>
        </div>

        {/* Content types being generated */}
        {isBatchGenerating && (
          <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="flex items-center justify-center p-2 sm:p-3 bg-blue-50 rounded-lg">
              <FaBookOpen className="text-blue-500 mr-1 sm:mr-2 text-sm sm:text-base" />
              <span className="text-xs text-blue-700 font-medium">Reading</span>
            </div>
            <div className="flex items-center justify-center p-2 sm:p-3 bg-purple-50 rounded-lg">
              <FaBrain className="text-purple-500 mr-1 sm:mr-2 text-sm sm:text-base" />
              <span className="text-xs text-purple-700 font-medium">Summary</span>
            </div>
            <div className="flex items-center justify-center p-2 sm:p-3 bg-red-50 rounded-lg">
              <FaVideo className="text-red-500 mr-1 sm:mr-2 text-sm sm:text-base" />
              <span className="text-xs text-red-700 font-medium">Videos</span>
            </div>
            <div className="flex items-center justify-center p-2 sm:p-3 bg-green-50 rounded-lg">
              <FaQuestionCircle className="text-green-500 mr-1 sm:mr-2 text-sm sm:text-base" />
              <span className="text-xs text-green-700 font-medium">Quiz</span>
            </div>
          </div>
        )}

        {/* Loading dots animation */}
        <div className="relative z-10">
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LoadingComponent;
