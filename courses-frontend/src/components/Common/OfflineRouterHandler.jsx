import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useOnlineStatus from '../../hooks/useOnlineStatus';

// Navigates to /offline when connection drops and back to the last page when restored
export default function OfflineRouterHandler() {
  const online = useOnlineStatus();
  const location = useLocation();
  const navigate = useNavigate();

  // Track last online path continuously (so we know where to go back)
  useEffect(() => {
    if (online && location.pathname !== '/offline') {
      const full = `${location.pathname}${location.search || ''}${location.hash || ''}`;
      localStorage.setItem('lastOnlinePath', full);
    }
  }, [online, location.pathname, location.search, location.hash]);

  // On offline, redirect to dedicated page
  useEffect(() => {
    if (!online && location.pathname !== '/offline') {
      navigate('/offline');
    }
  }, [online, location.pathname, navigate]);

  // On online while on /offline, redirect back automatically handled by OfflinePage too
  return null;
}
