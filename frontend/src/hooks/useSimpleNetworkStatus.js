import { useState, useEffect, useCallback } from 'react';

const useSimpleNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true); // Start optimistic - assume online
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  const handleOnline = useCallback(() => {
    console.log('🌐 Browser online event - setting online state');
    setIsOnline(true);
    setIsReconnecting(false);
    setReconnectAttempts(0);
  }, []);

  const handleOffline = useCallback(() => {
    console.log('🌐 Browser offline event - setting offline state');
    setIsOnline(false);
    setIsReconnecting(true);
  }, []);

  useEffect(() => {
    console.log('🌐 Initial navigator.onLine:', navigator.onLine);
    
    // Set initial state based on browser - only show offline if actually offline
    const initialOnlineState = navigator.onLine;
    setIsOnline(initialOnlineState);
    setIsReconnecting(!initialOnlineState);
    setHasInitialized(true);

    // Add event listeners for browser offline/online events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simple polling when offline
    let intervalId;
    if (!initialOnlineState) {
      intervalId = setInterval(() => {
        setReconnectAttempts(prev => prev + 1);
        console.log('🌐 Checking navigator.onLine:', navigator.onLine);
        if (navigator.onLine) {
          handleOnline();
        }
      }, 2000);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []); // Remove dependencies to run only once

  // Separate effect for polling when offline
  useEffect(() => {
    let intervalId;
    if (!isOnline && hasInitialized) {
      intervalId = setInterval(() => {
        setReconnectAttempts(prev => prev + 1);
        console.log('🌐 Polling - navigator.onLine:', navigator.onLine);
        if (navigator.onLine) {
          handleOnline();
        }
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOnline, hasInitialized, handleOnline]);

  return { 
    isOnline, 
    isReconnecting, 
    reconnectAttempts
  };
};

export default useSimpleNetworkStatus;
