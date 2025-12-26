import { useEffect, useRef } from 'react';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import universalToast from '../../utils/universalToast.jsx';

// Lightweight global listener to surface professional connectivity toasts
export default function OnlineStatusToaster() {
  const online = useOnlineStatus();
  const last = useRef(online);
  const shownOnce = useRef(false);

  useEffect(() => {
    // On first mount, if offline, show offline toast immediately
    if (!online && !shownOnce.current) {
      universalToast.error('No internet connection. Some features may not work until you reconnect.', { duration: 4000 });
      shownOnce.current = true;
    }
    // When status changes, show an appropriate toast
    if (last.current !== online) {
      if (!online) {
        universalToast.error('You are offline. Check your connection to continue.', { duration: 4000 });
      } else {
        universalToast.success('Back online. You’re good to go.', { duration: 2500 });
      }
      last.current = online;
    }
  }, [online]);

  return null;
}
