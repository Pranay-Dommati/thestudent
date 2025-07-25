import React from 'react';
import { BiLoaderAlt } from 'react-icons/bi';
import { IoSparkles } from 'react-icons/io5';

/**
 * Component to display the progress of batch content generation
 * 
 * @param {Object} props
 * @param {boolean} props.isGenerating - Whether batch generation is in progress
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.status - Status message
 * @param {Function} props.onClose - Function to call when close button is clicked
 */
const BatchGenerationStatus = ({ isGenerating, progress, status, onClose }) => {
  // Don't show the component if:
  // 1. Generation is not running AND progress is 100% (completed)
  // 2. Progress is 0 and generation is not running (not started)
  if ((!isGenerating && progress >= 100) || (!isGenerating && progress === 0)) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 bg-white border border-blue-200 rounded-lg shadow-lg z-50 p-4 animate-slide-up">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          {isGenerating ? (
            <BiLoaderAlt className="animate-spin text-blue-600 w-5 h-5 mr-2" />
          ) : (
            <IoSparkles className="text-blue-600 w-5 h-5 mr-2" />
          )}
          <h4 className="text-base font-semibold text-gray-800">
            {isGenerating ? 'Generating Content' : 'Generation Complete'}
          </h4>
        </div>
        {!isGenerating && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{status || 'Preparing all your course materials...'}</p>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-500 text-right">{Math.floor(progress)}% complete</div>
    </div>
  );
};

export default BatchGenerationStatus;
