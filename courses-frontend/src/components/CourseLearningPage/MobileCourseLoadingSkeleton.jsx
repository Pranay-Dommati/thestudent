import React from 'react';

/**
 * Mobile Skeleton Loading Component for Course Learning Page
 * Provides visual feedback while course content is loading on mobile
 */
const MobileCourseLoadingSkeleton = () => {
  return (
    <div className="h-full bg-white flex flex-col animate-pulse">
      {/* Mobile Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div className="h-5 bg-gray-300 rounded w-32"></div>
        </div>
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      </div>

      {/* Loading Message with Spinner - Mobile */}
      <div className="flex items-center justify-center py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3 px-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-700 font-medium text-sm">Sit tight while we load your content...</p>
        </div>
      </div>

      {/* Video Player and Content */}
      <div className="p-4">
        <div className="aspect-video bg-gray-300 rounded-lg w-full mb-4"></div>
        
        {/* Video Title Skeleton */}
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      </div>

      {/* Mobile Tabs Skeleton */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        {[1, 2, 3, 4].map((tab) => (
          <div key={tab} className="flex-1 py-3">
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-11/12"></div>
          <div className="h-4 bg-gray-200 rounded w-10/12"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-9/12"></div>
          <div className="h-4 bg-gray-200 rounded w-11/12"></div>
        </div>

        {/* Resources/Links Skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-gray-300 rounded w-1/3 mb-3"></div>
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-1"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation Skeleton */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex gap-2">
          <div className="w-20 h-8 bg-gray-300 rounded"></div>
          <div className="w-20 h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default MobileCourseLoadingSkeleton;