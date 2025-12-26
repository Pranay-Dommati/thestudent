import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';

const CompactRateLimitStatus = ({ usageStats, className = "" }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!usageStats || !isVisible) {
    return null;
  }

  const dailyUsed = usageStats.daily_used || usageStats.daily_count || 0;
  const dailyLimit = usageStats.daily_limit || 16;
  const remaining = Math.max(0, dailyLimit - dailyUsed);
  const requestLimit = usageStats.per_request_limit || usageStats.request_limit || 4;

  // Monthly (optional) from nested rate_limits.monthly or flat props
  const monthly = usageStats.rate_limits?.monthly;
  // Default to monthly enforcement unless daily.enforced is explicitly true
  const dailyEnforced = usageStats.rate_limits?.daily?.enforced !== undefined
    ? usageStats.rate_limits.daily.enforced
    : false;
  const monthlyText = monthly
    ? ` • ${Math.max(0, monthly.limit - (monthly.used || 0))} this month`
    : "";

  return (
    <div className="text-right">
      <div className="text-xs font-medium text-gray-600">
        {dailyEnforced
          ? `${remaining} topics per day upto ${requestLimit} per request`
          : `${monthly ? Math.max(0, monthly.limit - (monthly.used || 0)) : 15} topics per month upto ${requestLimit} per request`
        }
      </div>
    </div>
  );
};

export default CompactRateLimitStatus;