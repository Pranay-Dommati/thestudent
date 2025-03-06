// HeroSection.js
import React from 'react';
import ProgressCard from './ProgressCard';
import RatingStars from './RatingStars';

const HeroSection = ({ course, progressPercentage, completedLessons, totalLessons }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-xl -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-10 rounded-full blur-xl translate-y-1/2 -translate-x-1/4"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="md:max-w-3xl">
            {/* Course platform badge */}
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-4">
              {course.platform}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight">{course.title}</h1>
            
            <div className="flex flex-wrap items-center text-sm md:text-base mb-4">
              <span className="mr-2">Created by {course.instructor.name}</span>
              <span className="mx-2 hidden md:inline">•</span>
              <span className="flex items-center mt-1 md:mt-0">
                <RatingStars rating={course.rating} />
                <span className="ml-1">{course.rating} ({course.reviewCount} reviews)</span>
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {course.duration}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {course.level}
              </span>
              {course.tags.map(tag => (
                <span key={tag} className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">{tag}</span>
              ))}
            </div>
            
            {/* Compact course description for larger screens */}
            <p className="text-white/80 hidden md:block mb-6 max-w-xl">
              {course.description.substring(0, 150)}...
            </p>
          </div>
          
          {/* CTA Card */}
          <ProgressCard 
            progressPercentage={progressPercentage} 
            completedLessons={completedLessons} 
            totalLessons={totalLessons} 
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;