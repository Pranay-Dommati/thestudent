import React from 'react';
import useNetworkStatus from '../hooks/useNetworkStatus';

const NetworkStatusBanner = () => {
  const { isOnline, isReconnecting, reconnectAttempts } = useNetworkStatus();

  // Don't show anything if online and not reconnecting
  if (isOnline && !isReconnecting) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-100 border-b border-orange-200 text-orange-800 px-4 py-2 text-center text-sm font-medium shadow-sm">
      <div className="flex items-center justify-center space-x-2">
        {/* Loading spinner */}
        <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
        
        {/* Message */}
        <span>
          🌐 {!isOnline ? 'Connection issue detected' : 'Reconnecting'}{reconnectAttempts > 0 && ` (${reconnectAttempts})`}
        </span>
      </div>
    </div>
  );
};

export default NetworkStatusBanner;
