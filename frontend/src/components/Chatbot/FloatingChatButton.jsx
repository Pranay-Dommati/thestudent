import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaRobot } from 'react-icons/fa';

const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show the button on the chat page
  if (location.pathname === '/chat') {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/chat')}
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 
                 text-white rounded-full shadow-lg flex items-center justify-center 
                 transition-all duration-200 hover:scale-110 z-50"
      aria-label="Open Chat Assistant"
    >
      <FaRobot className="w-6 h-6" />
    </button>
  );
};

export default FloatingChatButton;