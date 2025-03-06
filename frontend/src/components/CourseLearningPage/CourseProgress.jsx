import React from 'react';

const CourseProgress = ({ completedLessons, totalLessons }) => {
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100) || 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">Your progress</span>
        <span>{progressPercentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }} 
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{completedLessons}/{totalLessons} lessons completed</span>
      </div>
    </div>
  );
};

export default CourseProgress;