// InstructorCard.js
import React from 'react';

const InstructorCard = ({ instructor }) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center bg-white rounded-lg p-4 border border-gray-200">
      <img src={instructor.avatar} alt={instructor.name} className="w-20 h-20 rounded-full mr-4 mb-4 md:mb-0" />
      <div>
        <h4 className="font-bold text-lg">{instructor.name}</h4>
        <p className="text-gray-600 mt-1">{instructor.bio}</p>
        <div className="flex mt-3 space-x-3">
          <button className="text-sm text-gray-600 hover:text-indigo-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View profile
          </button>
          <button className="text-sm text-gray-600 hover:text-indigo-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorCard;