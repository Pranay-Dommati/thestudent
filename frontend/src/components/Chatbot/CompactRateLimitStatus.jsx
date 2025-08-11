import React from 'react';
import { IoWarningOutline, IoCheckmarkCircle, IoFlashOutline, IoTimeOutline, IoSparkles, IoTrendingUp } from 'react-icons/io5';

const CompactRateLimitStatus = ({ usageStats, className = "" }) => {
  if (!usageStats) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50/90 border border-gray-200/60 text-gray-500 text-xs ${className}`}>
        <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading...</span>
      </div>
    );
  }

  const dailyUsed = usageStats.daily_used || usageStats.daily_count || 0;
  const dailyLimit = usageStats.daily_limit || 16;
  const remaining = dailyLimit - dailyUsed;
  const requestLimit = usageStats.per_request_limit || usageStats.request_limit || 4;
  
  // Calculate usage percentage for visual indicators
  const usagePercentage = (dailyUsed / dailyLimit) * 100;
  
  // Professional, subtle color scheme
  const getStatusConfig = () => {
    if (remaining === 0) {
      return {
        icon: IoWarningOutline,
        textColor: 'text-red-600',
        accentColor: 'text-red-500'
      };
    } else if (remaining <= 3) {
      return {
        icon: IoFlashOutline,
        textColor: 'text-orange-600',
        accentColor: 'text-orange-500'
      };
    } else {
      return {
        icon: IoSparkles,
        textColor: 'text-gray-700',
        accentColor: 'text-blue-500'
      };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50/90 border border-gray-200/60 transition-all duration-200 ${className}`}>
      {/* Compact Status Icon */}
      <div className={`flex items-center justify-center w-4 h-4 ${config.accentColor}`}>
        <IconComponent size={12} />
      </div>
      
      {/* Compact Content - Single Line */}
      <div className="flex items-center gap-1">
        <span className={`text-xs font-medium ${config.textColor}`}>
          <span className="font-bold">{remaining}</span> topics left
        </span>
        <span className="text-gray-400 text-xs">•</span>
        <span className={`text-xs ${config.textColor} opacity-75`}>
          <span className="font-medium">{requestLimit}</span>/request
        </span>
      </div>
    </div>
  );
};

export default CompactRateLimitStatus;
