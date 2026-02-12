import React from 'react';
import { useNavigate } from 'react-router-dom';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const OfflinePage = () => {
  const online = useOnlineStatus();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (online) {
      const last = localStorage.getItem('lastOnlinePath') || '/';
      navigate(last, { replace: true });
    }
  }, [online, navigate]);

  const handleRetry = () => {
    if (navigator.onLine) {
      const last = localStorage.getItem('lastOnlinePath') || '/';
      navigate(last, { replace: true });
    } else {
      // Force a reload to re-evaluate connectivity
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-md w-full px-6 text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
          {/* WiFi-off icon (SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25a15.75 15.75 0 0 1 19.5 0M4.5 11.25a12.75 12.75 0 0 1 15 0M7.5 14.25a9.75 9.75 0 0 1 9 0M12 20.25h.007M4 4l16 16" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">No Internet Connection</h1>
        <p className="mt-2 text-gray-600">
          You’re offline. Check your connection and try again. We’ll take you back where you left off once you’re online.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={handleRetry} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
            Retry
          </button>
          <button onClick={() => navigate('/', { replace: true })} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Go Home
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400">Tip: If you’re on mobile, check Airplane mode or Wi‑Fi settings.</p>
      </div>
    </div>
  );
};

export default OfflinePage;
