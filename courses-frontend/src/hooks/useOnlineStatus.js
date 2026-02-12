import { useEffect, useState } from 'react';

// Simple hook to track browser online/offline status using navigator.onLine and events
export default function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
