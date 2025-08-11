import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';

const CompactRateLimitStatus = ({ usageStats, className = "" }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!usageStats || !isVisible) {
    return null;
  }

  const dailyUsed = usageStats.daily_used || usageStats.daily_count || 0;
  const dailyLimit = usageStats.daily_limit || 16;
  const remaining = dailyLimit - dailyUsed;
  const requestLimit = usageStats.per_request_limit || usageStats.request_limit || 4;

  return (
    <div className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className="text-indigo-600 font-medium">
        {remaining} topics remaining today. Up to {requestLimit} per request.
      </span>
      <button
        onClick={() => setIsVisible(false)}
        className="text-indigo-400 hover:text-indigo-600 transition-colors p-0.5 rounded-sm hover:bg-indigo-50"
        title="Dismiss"
      >
        <IoClose size={16} />
      </button>
    </div>
  );
};

export default CompactRateLimitStatus;
