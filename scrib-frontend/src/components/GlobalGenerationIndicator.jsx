import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const GlobalGenerationIndicator = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [generatingPacks, setGeneratingPacks] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) {
      setGeneratingPacks([]);
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await axiosInstance.get('/scrib/my-study-packs/');
        // The API returns paginated results, packs are in response.data.results
        const packs = response.data.results || response.data;
        if (Array.isArray(packs)) {
          const active = packs.filter(p => p.status === 'generating' || p.status === 'queued' || p.status === 'pending');
          setGeneratingPacks(active);
        }
      } catch (err) {
        console.error('Failed to check generation status', err);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Hide on the /generate page since that page already has its own History tab UI
  if (!generatingPacks.length || location.pathname === '/generate') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-auto md:bottom-6 md:right-6 md:gap-3">
      {generatingPacks.slice(0, 3).map(pack => (
        <div 
          key={pack.id}
          onClick={() => navigate('/generate?tab=history')}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-black bg-white p-3 shadow-xl transition-all active:scale-95 md:gap-4 md:p-4 hover:scale-105 hover:shadow-2xl"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f8f5f1] md:h-10 md:w-10">
            <svg className="h-4 w-4 animate-spin text-black md:h-5 md:w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-black md:text-sm">Generating Notes...</p>
            <p className="text-[11px] font-medium text-gray-700 line-clamp-1 max-w-[150px] md:text-xs md:max-w-[180px]">
              {pack.title || pack.topic || 'Custom Topic'} • {pack.total_pages || pack.pages || 1} pages
            </p>
          </div>
        </div>
      ))}
      {generatingPacks.length > 3 && (
        <div 
          onClick={() => navigate('/generate?tab=history')}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-black bg-white py-2 text-xs font-semibold text-black shadow-md hover:bg-gray-100"
        >
          +{generatingPacks.length - 3} more generating...
        </div>
      )}
    </div>
  );
};

export default GlobalGenerationIndicator;
