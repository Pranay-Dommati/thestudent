import React from 'react';
import { IoWarningOutline, IoCheckmarkCircle, IoFlashOutline, IoTimeOutline, IoSparkles, IoTrendingUp } from 'react-icons/io5';

const CompactRateLimitStatus = ({ usageStats, className = "" }) => {
  if (!usageStats) {
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-md border border-gray-200/50 text-gray-500 text-sm font-medium shadow-lg ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading limits...</span>
      </div>
    );
  }

  const dailyUsed = usageStats.daily_used || usageStats.daily_count || 0;
  const dailyLimit = usageStats.daily_limit || 16;
  const remaining = dailyLimit - dailyUsed;
  const requestLimit = usageStats.per_request_limit || usageStats.request_limit || 4;
  
  // Calculate usage percentage for visual indicators
  const usagePercentage = (dailyUsed / dailyLimit) * 100;
  
  // Match the page's indigo/blue color scheme
  const getStatusConfig = () => {
    if (remaining === 0) {
      return {
        icon: IoWarningOutline,
        bgColor: 'bg-red-50/80',
        border: 'border-red-200/50',
        textColor: 'text-red-700',
        accentColor: 'text-red-500',
        progressColor: 'bg-red-500'
      };
    } else if (remaining <= 3) {
      return {
        icon: IoFlashOutline,
        bgColor: 'bg-amber-50/80',
        border: 'border-amber-200/50',
        textColor: 'text-amber-800',
        accentColor: 'text-amber-600',
        progressColor: 'bg-amber-500'
      };
    } else {
      // Match the page's indigo theme for normal/good status
      return {
        icon: IoSparkles,
        bgColor: 'bg-indigo-50/80',
        border: 'border-indigo-200/50',
        textColor: 'text-indigo-700',
        accentColor: 'text-indigo-600',
        progressColor: 'bg-indigo-500'
      };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ${config.bgColor} ${config.border} border backdrop-blur-md shadow-lg transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Status Icon */}
      <div className={`flex items-center justify-center w-6 h-6 rounded-lg bg-white/60 ${config.accentColor} shadow-sm`}>
        <IconComponent size={14} className="drop-shadow-sm" />
      </div>
      
      {/* Content Section */}
      <div className="flex flex-col gap-0.5">
        {/* Top Row: Topics remaining message */}
        <div className="flex items-center">
          <span className={`text-sm font-medium ${config.textColor}`}>
            <span className="font-bold">{remaining}</span> topics remaining today.
          </span>
        </div>
        
        {/* Bottom Row: Request limit message */}
        <div className="flex items-center gap-2">
          <span className={`text-xs ${config.textColor} opacity-80`}>
            You can create up to <span className="font-bold">{requestLimit}</span> topics per request.
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompactRateLimitStatus;
