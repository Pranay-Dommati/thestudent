import React from 'react';

/**
 * Skeleton Loading Component for Course Learning Page
 * Provides visual feedback while course content is loading
 */
const CourseLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex bg-white animate-pulse" style={{ minHeight: '100vh' }}>
        {/* Main Content Skeleton */}
        <div className="flex-1 mr-[350px] p-6 overflow-hidden pb-32">
          {/* Loading Message with Spinner - Above Video */}
          <div className="flex items-center justify-center py-3 mb-4">
            <div className="flex items-center gap-3 px-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
              <p className="text-gray-700 font-medium text-sm">Sit tight while we load your content...</p>
            </div>
          </div>

          {/* Video Player Skeleton - Full width with proper constraints */}
          <div className="mb-6">
            <div className="w-full" style={{ aspectRatio: '16/9' }}>
              <div className="w-full h-full bg-gray-300 rounded-lg"></div>
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="flex gap-3 mb-6">
            {[1, 2, 3, 4].map((tab) => (
              <div key={tab} className="h-8 bg-gray-200 rounded w-20"></div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="space-y-3 mb-8">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-11/12"></div>
            <div className="h-3 bg-gray-200 rounded w-10/12"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-9/12"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-8/12"></div>
          </div>

          {/* Additional content spacing to prevent footer overlap */}
          <div className="h-16"></div>
        </div>

        {/* Right Sidebar Skeleton - Enhanced */}
        <div className="fixed right-0 top-0 w-[350px] h-screen bg-white border-l border-gray-200 overflow-y-auto">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-100">
            {/* Course Title Skeleton */}
            <div className="mb-4">
              <div className="h-7 bg-gray-300 rounded-md w-4/5 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/5"></div>
            </div>

            {/* Progress Bar Skeleton */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-10"></div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full w-full">
                <div className="h-2 bg-gray-300 rounded-full w-1/3"></div>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="p-6 pb-8">
            {/* Chapter Skeletons */}
            {[1, 2, 3].map((chapter) => (
              <div key={chapter} className="mb-6">
                {/* Chapter Header */}
                <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <div className="h-5 bg-gray-300 rounded w-2/3"></div>
                </div>
                
                {/* Lesson Skeletons */}
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((lesson) => (
                    <div key={lesson} className="flex items-center gap-3 ml-6 p-2 hover:bg-gray-50 rounded">
                      <div className="w-3 h-3 bg-gray-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-4/5 mb-1"></div>
                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                      </div>
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Additional Course Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLoadingSkeleton;
