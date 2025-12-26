// CourseTabs.js
import React from 'react';

const CourseTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="border-b">
      <nav className="flex overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('outline')} 
          className={`px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'outline' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Course Outline
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Overview
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('reviews')} 
          className={`px-6 py-4 font-medium whitespace-nowrap ${activeTab === 'reviews' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Reviews
          </div>
        </button>
      </nav>
    </div>
  );
};

export default CourseTabs;