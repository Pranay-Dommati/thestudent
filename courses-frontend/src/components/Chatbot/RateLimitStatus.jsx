import React, { useState, useEffect } from 'react';
import { getRateLimitStatus, formatUsageStats, getStatusMessage, MAX_TOPICS_PER_REQUEST } from '../ProLearning/topicclassifier';

const RateLimitStatus = ({ isProMode, usageStats = null }) => {
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchRateLimitStatus = async () => {
    if (!isProMode) return;
    
    setLoading(true);
    try {
      const status = await getRateLimitStatus();
      setRateLimitInfo(status);
    } catch (error) {
      console.error('Failed to fetch rate limit status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use provided usageStats if available, otherwise fetch from API
    if (usageStats) {
      const formatted = formatUsageStats(usageStats);
      if (formatted) {
        setRateLimitInfo(formatted);
      }
    } else {
      fetchRateLimitStatus();
    }
    
    // Refresh status every 30 seconds when pro mode is active
    let interval;
    if (isProMode && !usageStats) {
      interval = setInterval(fetchRateLimitStatus, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProMode, usageStats]);

  if (!isProMode || !rateLimitInfo) {
    return null;
  }

  const monthlyInfo = rateLimitInfo.monthly || { used: 0, limit: 15, remaining: 15 };
  const dailyInfo = rateLimitInfo.daily || { used: 0, limit: 16, remaining: 16, enforced: false };
  const requestInfo = rateLimitInfo.request;
  const progressPercentage = (monthlyInfo.percentage || Math.round((monthlyInfo.used / monthlyInfo.limit) * 100)) || 0;
  const isNearLimit = progressPercentage > 80;
  const isAtLimit = monthlyInfo.remaining === 0;

  // Tooltip content
  const tooltipContent = (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 w-64">
      <div className="space-y-2">
        <div className="border-b border-gray-700 pb-2">
          <h4 className="font-semibold text-yellow-200">Rate Limits</h4>
        </div>
        <div className="flex justify-between">
          <span>Monthly Topics:</span>
          <span className="font-mono">{monthlyInfo.used}/{monthlyInfo.limit}</span>
        </div>
        <div className="flex justify-between">
          <span>Remaining this month:</span>
          <span className={`font-mono ${monthlyInfo.remaining > 3 ? 'text-green-300' : monthlyInfo.remaining > 0 ? 'text-yellow-300' : 'text-red-300'}`}>
            {monthlyInfo.remaining}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Per Request Limit:</span>
          <span className="font-mono">{requestInfo.limit}</span>
        </div>
        <div className="border-t border-gray-700 pt-2">
          <p className="text-gray-300">
            {isAtLimit 
              ? "Monthly limit reached. Resets on the 1st." 
              : `You can create up to ${Math.min(monthlyInfo.remaining, requestInfo.limit)} topics in your next request.`
            }
          </p>
        </div>
      </div>
      {/* Tooltip arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  );

  return (
    <div className="relative">
      <div 
        className={`mb-4 p-3 rounded-lg border transition-all duration-300 cursor-help ${
          isAtLimit ? 'bg-red-50 border-red-200 hover:bg-red-100' : 
          isNearLimit ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' : 
          'bg-blue-50 border-blue-200 hover:bg-blue-100'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm font-medium flex items-center gap-2 ${
            isAtLimit ? 'text-red-800' : 
            isNearLimit ? 'text-yellow-800' : 
            'text-blue-800'
          }`}>
            <span>Topic Creation Limits</span>
            {loading && (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
            )}
            <svg 
              className="w-4 h-4 opacity-60" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-mono ${
              isAtLimit ? 'bg-red-100 text-red-800' : 
              isNearLimit ? 'bg-yellow-100 text-yellow-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {monthlyInfo.used}/{monthlyInfo.limit}
            </span>
            {monthlyInfo.remaining <= 5 && monthlyInfo.remaining > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                {monthlyInfo.remaining} left
              </span>
            )}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              isAtLimit ? 'bg-red-500' : 
              isNearLimit ? 'bg-yellow-500' : 
              'bg-blue-500'
            }`}
            style={{ 
              width: `${Math.min(progressPercentage, 100)}%`,
              transition: 'width 0.5s ease-out'
            }}
          >
            {progressPercentage > 10 && (
              <div className="h-full bg-gradient-to-r from-transparent to-white/20"></div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className={`font-medium ${
            isAtLimit ? 'text-red-600' : 
            isNearLimit ? 'text-yellow-600' : 
            'text-blue-600'
          }`}>
            {getStatusMessage({ rate_limits: { monthly: monthlyInfo } })}
          </span>
          <span className="text-gray-500 font-mono">
            Max {requestInfo.limit}/request
          </span>
        </div>
        
        {isAtLimit && (
          <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Monthly limit reached. Resets on the 1st. Contact support for higher limits.</span>
          </div>
        )}
        
        {isNearLimit && !isAtLimit && (
          <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.664 0L3.25 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Approaching monthly limit. Plan your remaining topics wisely.</span>
          </div>
        )}
      </div>
      
      {/* Enhanced Tooltip */}
      {showTooltip && tooltipContent}
    </div>
  );
};

export default RateLimitStatus;
