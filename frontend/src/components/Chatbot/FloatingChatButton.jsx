import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaRobot } from 'react-icons/fa';

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't show the button on the chat page, quiz pages, or admin pages
  if (
    location.pathname === '/chat' || 
    location.pathname.includes('/learning/quiz') ||
    location.pathname.startsWith('/admin-p') || // Add this condition
    location.pathname === '/pro-learning' // Hide on Pro Learning page
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? '16px' : '24px',
        right: isMobile ? '16px' : '24px',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      <button
        onClick={() => navigate('/chat')}
        className={`w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 hover:bg-blue-700 
                   text-white rounded-full shadow-lg flex items-center justify-center 
                   transition-all duration-200 hover:scale-110 active:scale-95 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        aria-label="Open Chat Assistant"
        style={{
          border: 'none',
          outline: 'none'
        }}
      >
        <FaRobot className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  );
};

export default FloatingChatButton;