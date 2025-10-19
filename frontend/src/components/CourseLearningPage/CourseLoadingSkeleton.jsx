import React from 'react';

/**
 * Skeleton Loading Component for Course Learning Page
 * Provides visual feedback while course content is loading
 */
const CourseLoadingSkeleton = () => {
  return (
    <div className="flex h-screen bg-gray-50 animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-96 bg-white border-r border-gray-200 p-6">
        {/* Course Title Skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-gray-300 rounded-md w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Progress Bar Skeleton */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full w-full"></div>
        </div>

        {/* Chapter Skeletons */}
        {[1, 2, 3].map((chapter) => (
          <div key={chapter} className="mb-4">
            <div className="h-6 bg-gray-300 rounded w-2/3 mb-3"></div>
            {/* Lesson Skeletons */}
            {[1, 2, 3, 4].map((lesson) => (
              <div key={lesson} className="ml-4 mb-2">
                <div className="h-5 bg-gray-200 rounded w-4/5"></div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-8">
        {/* Video Player Skeleton */}
        <div className="mb-6">
          <div className="aspect-video bg-gray-300 rounded-lg w-full"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-4 mb-6">
          {[1, 2, 3, 4].map((tab) => (
            <div key={tab} className="h-10 bg-gray-200 rounded w-24"></div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-11/12"></div>
          <div className="h-4 bg-gray-200 rounded w-10/12"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-9/12"></div>
        </div>
      </div>
    </div>
  );
};

export default CourseLoadingSkeleton;
