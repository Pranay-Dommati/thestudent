import React from 'react';
import useNetworkStatus from '../hooks/useNetworkStatus';

const OfflineWrapper = ({ children, fallback, showBanner = false }) => {
  const { isOnline, isReconnecting, reconnectAttempts } = useNetworkStatus();

  // If we want to show the banner-style message
  if (showBanner && (!isOnline || isReconnecting)) {
    return (
      <div className="w-full bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2 text-orange-800">
          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">
            🌐 {!isOnline ? 'Connection issue detected' : 'Reconnecting'}{reconnectAttempts > 0 && ` (${reconnectAttempts})`}
          </span>
        </div>
      </div>
    );
  }

  // If offline and we have a custom fallback
  if ((!isOnline || isReconnecting) && fallback) {
    return fallback;
  }

  // If offline with default fallback
  if (!isOnline || isReconnecting) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-orange-50 rounded-lg border border-orange-200">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-semibold text-orange-800 mb-2">🌐 Connection Issue</h3>
        <p className="text-orange-700 mb-2">We're working to restore your connection...</p>
        {reconnectAttempts > 0 && (
          <p className="text-sm text-orange-600">Attempt {reconnectAttempts}</p>
        )}
      </div>
    );
  }

  // If online, render children normally
  return children;
};

export default OfflineWrapper;
