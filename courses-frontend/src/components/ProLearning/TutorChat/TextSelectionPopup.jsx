import React from 'react';
import { IoSparkles } from 'react-icons/io5';

const TextSelectionPopup = ({ position, onAskSia }) => {
  if (!position) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="animate-fade-in-up pointer-events-auto">
        <button
          onClick={onAskSia}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium"
        >
          <IoSparkles className="text-lg" />
          Ask Sia
        </button>
      </div>
      
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TextSelectionPopup;
