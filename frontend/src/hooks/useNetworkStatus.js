import { useState, useEffect, useCallback } from 'react';

const useNetworkStatus = () => {
  // Start with browser's navigator.onLine but verify with actual connectivity
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Function to test actual connectivity by trying to fetch a resource
  const testConnectivity = useCallback(async () => {
    // If browser says offline, don't even try to fetch
    if (!navigator.onLine) {
      return false;
    }

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Shorter 3 second timeout

    try {
      // Try a simple GET request to a reliable endpoint
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal,
        mode: 'no-cors' // This allows cross-origin requests
      });
      clearTimeout(timeoutId);
      return true; // If we get here, we have connectivity
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Fallback: try another reliable endpoint
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 2000);
      
      try {
        await fetch('https://httpbin.org/get', {
          method: 'GET',
          cache: 'no-cache',
          signal: fallbackController.signal,
        });
        clearTimeout(fallbackTimeoutId);
        return true;
      } catch {
        clearTimeout(fallbackTimeoutId);
        return false;
      }
    }
  }, []);

  const handleOnline = useCallback(async () => {
    console.log('🌐 Browser online event triggered');
    // When browser says we're online, test actual connectivity
    const isActuallyOnline = await testConnectivity();
    console.log('🌐 Connectivity test result:', isActuallyOnline);
    
    if (isActuallyOnline) {
      setIsOnline(true);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      console.log('🌐 Successfully set online state');
    } else {
      // Browser says online but we can't reach servers - treat as offline
      setIsOnline(false);
      setIsReconnecting(true);
      console.log('🌐 Browser says online but connectivity test failed');
    }
  }, [testConnectivity]);

  const handleOffline = useCallback(() => {
    console.log('🌐 Browser offline event triggered');
    // Browser detected offline - immediately set offline state
    setIsOnline(false);
    setIsReconnecting(true);
  }, []);

  const attemptReconnection = useCallback(async () => {
    console.log('🌐 Attempting reconnection...', { isOnline, navigator: navigator.onLine });
    // Only attempt reconnection if we're currently offline/reconnecting
    if (!isOnline) {
      setReconnectAttempts(prev => prev + 1);
      
      const isActuallyOnline = await testConnectivity();
      console.log('🌐 Reconnection test result:', isActuallyOnline);
      
      if (isActuallyOnline) {
        setIsOnline(true);
        setIsReconnecting(false);
        setReconnectAttempts(0);
        console.log('🌐 Reconnection successful!');
      } else {
        // Still offline, keep reconnecting state
        setIsReconnecting(true);
        console.log('🌐 Still offline, will retry...');
      }
    }
  }, [isOnline, testConnectivity]);

  useEffect(() => {
    // Start optimistic - trust browser initially, then verify
    setIsOnline(navigator.onLine);
    setIsReconnecting(false);

    // Only do connectivity check if browser says we're offline
    if (!navigator.onLine) {
      const initialCheck = async () => {
        const isConnected = await testConnectivity();
        setIsOnline(isConnected);
        if (!isConnected) {
          setIsReconnecting(true);
        }
      };
      initialCheck();
    }

    // Add event listeners for browser offline/online events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, testConnectivity]);

  // Separate effect for reconnection polling to avoid loopholes
  useEffect(() => {
    let intervalId;
    
    if (!isOnline || isReconnecting) {
      console.log('🌐 Setting up reconnection polling...');
      intervalId = setInterval(() => {
        attemptReconnection();
      }, 3000); // Check every 3 seconds when offline or reconnecting
    }

    return () => {
      if (intervalId) {
        console.log('🌐 Clearing reconnection polling...');
        clearInterval(intervalId);
      }
    };
  }, [isOnline, isReconnecting, attemptReconnection]);

  return { 
    isOnline, 
    isReconnecting, 
    reconnectAttempts,
    testConnectivity
  };
};

export default useNetworkStatus;
