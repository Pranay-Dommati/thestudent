import React, { useState, useEffect } from 'react';
import { IoRocket, IoSparkles } from "react-icons/io5";
import { HiLightningBolt } from "react-icons/hi";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiAxios from '../../utils/axios';

const VISITOR_KEY = 'easylearnova_has_visited';

const OnboardingModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
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
        setTimeout(() => setIsAnimating(true), 50);
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
          setTimeout(() => setIsAnimating(true), 50);
        }, 500);
      }
    }
  }, [isLoggedIn, user, hasMarkedSeen]);

  const handleClose = async () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowModal(false);
      setHasMarkedSeen(true);
    }, 200);
    
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
    setIsAnimating(false);
    setTimeout(() => {
      setShowModal(false);
      setHasMarkedSeen(true);
      
      // Mark as visited
      if (isFirstTimeVisitor) {
        localStorage.setItem(VISITOR_KEY, 'true');
        setIsFirstTimeVisitor(false);
      }
      
      if (sampleText) {
        navigate('/chat', { state: { initialMessage: sampleText, forceProMode: true } });
      } else {
        navigate('/chat');
      }
    }, 150);
  };

  // If modal not needed, render nothing
  if (!showModal) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? 'bg-black/50 backdrop-blur-md' : 'bg-transparent'
      }`}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="onboarding-title"
    >
      {/* Modal Card */}
      <div 
        className={`relative w-full max-w-md transform transition-all duration-300 ease-out ${
          isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Glow effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-30 animate-pulse-slow"></div>
        
        {/* Main Card */}
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          {/* Content */}
          <div className="px-8 pt-8 pb-6">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <IoRocket className="w-8 h-8 text-white" />
                </div>
                {/* Sparkle decoration */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-md">
                  <IoSparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h3 
              id="onboarding-title" 
              className="text-2xl font-bold text-center text-gray-900 mb-2"
            >
              <span className="inline-flex items-center gap-1.5">
                <HiLightningBolt className="w-6 h-6 text-yellow-500" />
                Build your course instantly
              </span>
            </h3>
            
            {/* Subtitle */}
            <p className="text-center text-gray-500 mb-6 text-sm">
              Just type your idea — we'll handle the rest.
            </p>
            
            {/* Example prompts - Desktop: two options, Mobile: single "Try" prompt */}
            {/* Desktop version */}
            <div className="hidden sm:flex flex-wrap gap-2 justify-center mb-6">
              {["Learn Trigonometry", "Python Basics"].map((sample) => (
                <button
                  key={sample}
                  onClick={() => handleStartCreating(sample)}
                  className="group px-4 py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-full text-sm text-gray-600 hover:text-indigo-600 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <span className="opacity-60 group-hover:opacity-100">"</span>
                  {sample}
                  <span className="opacity-60 group-hover:opacity-100">"</span>
                </button>
              ))}
            </div>
            
            {/* Mobile version - Single engaging "Try" prompt */}
            <div className="sm:hidden flex justify-center mb-6">
              <button
                onClick={() => handleStartCreating("Learn Python")}
                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 hover:border-indigo-300 rounded-full text-sm text-indigo-600 hover:text-indigo-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span className="text-indigo-400 group-hover:text-indigo-500">Try:</span>
                <span className="font-medium">"Learn Python"</span>
                <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
            
            {/* Action Buttons - Always side by side */}
            <div className="flex flex-row gap-3">
              {/* Cancel Button */}
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.98] text-sm sm:text-base"
              >
                Maybe Later
              </button>
              
              {/* Start Creating Button */}
              <button
                onClick={() => handleStartCreating()}
                className="flex-1 group relative px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] overflow-hidden text-sm sm:text-base"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center gap-1.5 sm:gap-2">
                  <IoRocket className="w-4 h-4" />
                  <span className="hidden sm:inline">Start Creating</span>
                  <span className="sm:hidden">Start</span>
                </span>
              </button>
            </div>
          </div>
          
          {/* Bottom decorative element */}
          <div className="h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
