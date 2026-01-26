import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

const StatusBanner = () => {
    const [isVisible, setIsVisible] = useState(true);
    const location = useLocation();

    // Only show on Code Visualizer page (Home)
    const isHomePage = location.pathname === '/' || location.pathname === '/code-visualizer';

    if (!isVisible || !isHomePage) return null;

    return (
        <div className="bg-slate-50 border-b border-indigo-100 relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-lg" role="img" aria-label="experimental">🧪</span>
                        <p className="text-xs sm:text-sm font-medium text-slate-600">
                            <span className="font-semibold text-indigo-900">Public Beta</span>
                            <span className="mx-1.5 text-slate-300">|</span>
                            Code Visualizer is stable. Feature updates are currently paused.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                        aria-label="Dismiss"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusBanner;
