import { useState, useEffect, useCallback } from 'react';

const useBasicNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true); // Always start online
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Function to actually test connectivity
  const verifyConnectivity = useCallback(async () => {
    setIsVerifying(true);
    
    try {
      // Test with a simple, reliable endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      await fetch('https://www.google.com/favicon.ico', {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal,
        mode: 'no-cors'
      });
      
      clearTimeout(timeoutId);
      return true; // Successfully reached the internet
    } catch (error) {
      // Try fallback
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 2000);
        
        await fetch('https://httpbin.org/get', {
          method: 'GET',
          cache: 'no-cache',
          signal: controller2.signal,
        });
        
        clearTimeout(timeoutId2);
        return true;
      } catch {
        return false; // No internet connectivity
      }
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Manual verification when user clicks "I'm Online Now"
  const manualVerification = useCallback(async () => {
    console.log('🌐 Manual verification started...');
    const isActuallyOnline = await verifyConnectivity();
    
    if (isActuallyOnline) {
      console.log('🌐 Verification successful - user is online');
      setIsOnline(true);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      return true;
    } else {
      console.log('🌐 Verification failed - user is still offline');
      setIsOnline(false);
      setIsReconnecting(true);
      setReconnectAttempts(prev => prev + 1);
      return false;
    }
  }, [verifyConnectivity]);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setIsReconnecting(false);
    setReconnectAttempts(0);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setIsReconnecting(true);
  }, []);

  useEffect(() => {
    // Only set offline if browser explicitly says we're offline
    if (!navigator.onLine) {
      setIsOnline(false);
      setIsReconnecting(true);
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Handle reconnection attempts when offline with automatic connectivity testing
  useEffect(() => {
    let intervalId;
    
    if (!isOnline && !isVerifying) {
      console.log('🌐 Starting automatic connectivity checking...');
      intervalId = setInterval(async () => {
        setReconnectAttempts(prev => prev + 1);
        
        // First check if browser says we're back online
        if (navigator.onLine) {
          console.log('🌐 Browser says online, verifying actual connectivity...');
          const isActuallyOnline = await verifyConnectivity();
          
          if (isActuallyOnline) {
            console.log('🌐 Auto-verification successful - back online');
            setIsOnline(true);
            setIsReconnecting(false);
            setReconnectAttempts(0);
          } else {
            console.log('🌐 Auto-verification failed - still offline');
            setIsReconnecting(true);
          }
        } else {
          console.log('🌐 Browser still reports offline, continuing to check...');
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (intervalId) {
        console.log('🌐 Clearing automatic connectivity checking...');
        clearInterval(intervalId);
      }
    };
  }, [isOnline, isVerifying, verifyConnectivity]);

  return { 
    isOnline, 
    isReconnecting, 
    reconnectAttempts,
    isVerifying,
    manualVerification
  };
};

export default useBasicNetworkStatus;
