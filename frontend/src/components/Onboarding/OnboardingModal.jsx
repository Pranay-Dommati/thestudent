import React, { useState, useEffect } from 'react';
import { IoClose, IoRocket } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiAxios from '../../utils/axios';
import '../Chatbot/welcomeCardFix.css';

const VISITOR_KEY = 'easylearnova_has_visited';

const OnboardingModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState(false);
  // Be defensive: if AuthProvider hasn't mounted yet, use optional chaining
  const auth = useAuth();
  const user = auth?.user;
  const isLoggedIn = !!auth?.isLoggedIn;
  const validateAuth = auth?.validateAuth || (() => Promise.resolve());
  const navigate = useNavigate();

  // Check for first-time visitors (not logged in and never visited before)
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem(VISITOR_KEY);
    
    // If user is not logged in and hasn't visited before, show the modal
    if (!isLoggedIn && !hasVisitedBefore) {
      setIsFirstTimeVisitor(true);
      // Small delay for smooth page load
      setTimeout(() => {
        setShowModal(true);
      }, 1000);
    }
  }, [isLoggedIn]);

  // Check for logged-in users who haven't seen onboarding
  useEffect(() => {
    // Only check when user is logged in
    if (isLoggedIn && user) {
      // Check if user has seen onboarding from the user object
      // Also check our local flag to prevent re-showing after marking as seen
      if (!user.has_seen_onboarding && !hasMarkedSeen) {
        // Small delay to ensure smooth transition after login
        setTimeout(() => {
          setShowModal(true);
        }, 500);
      }
    }
  }, [isLoggedIn, user, hasMarkedSeen]);

  const handleClose = async () => {
    setShowModal(false);
    setHasMarkedSeen(true); // Immediately set local flag
    
    // Mark as visited in localStorage for non-logged-in users
    if (isFirstTimeVisitor) {
      localStorage.setItem(VISITOR_KEY, 'true');
      setIsFirstTimeVisitor(false);
      return; // Don't call API for non-logged-in users
    }
    
    // Mark onboarding as seen via API (only for logged-in users)
    if (isLoggedIn) {
      try {
        await apiAxios.post('/auth/onboarding/mark-seen/');
        // Re-validate auth to update user object with latest data
        try { await validateAuth(); } catch {}
      } catch (error) {
        console.error('Failed to mark onboarding as seen:', error);
      }
    }
  };

  const handleStartCreating = (sampleText = null) => {
    handleClose();
    
    if (sampleText) {
      // Navigate to chat page and pass the sample text to be sent automatically
      navigate('/chat', { state: { initialMessage: sampleText, forceProMode: true } });
    } else {
      // Just navigate to chat page without any message
      navigate('/chat');
    }
  };

  // If modal not needed, render nothing
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 welcome-message-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      {/* Overlay (click to close) */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Centered Card */}
      <div className="welcome-card-container">
        <div className="rounded-2xl animate-slide-down welcome-card relative">
          {/* Minimal header bar */}
          <div className="welcome-card-header"></div>
          
          <button
            onClick={handleClose}
            className="welcome-card-close-btn"
            aria-label="Close"
          >
            <IoClose className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="welcome-card-content">
            <div className="welcome-card-icon">
              <IoRocket className="w-5 h-5 text-white" />
            </div>
            
            <h3 id="onboarding-title" className="welcome-card-title">⚡ Build your course instantly.</h3>
            <p className="welcome-card-subtitle">Just type your idea — we'll handle the rest.</p>
            
            {/* Example prompts above button */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {[
                "Learn Trigonometry",
                "Python Basics"
              ].map((sample) => (
                <button
                  key={sample}
                  onClick={() => handleStartCreating(sample)}
                  className="welcome-card-example-btn"
                >
                  "{sample}"
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handleStartCreating()}
              className="welcome-card-cta"
            >
              Start Creating
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
