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
          const active = packs.filter(p => p.status === 'generating' || p.status === 'queued');
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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-auto">
      {generatingPacks.slice(0, 3).map(pack => (
        <div 
          key={pack.id}
          onClick={() => navigate('/generate?tab=history')}
          className="flex cursor-pointer items-center gap-4 rounded-xl border border-black bg-white p-4 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8f5f1]">
            <svg className="h-5 w-5 animate-spin text-black" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-bold text-black">Generating Notes...</p>
            <p className="text-xs font-medium text-gray-700 line-clamp-1 max-w-[180px]">
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
