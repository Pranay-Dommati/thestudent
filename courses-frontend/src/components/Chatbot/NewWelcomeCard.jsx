import React from 'react';
import { IoClose, IoRocket } from "react-icons/io5";
import './welcomeCardFix.css';

const NewWelcomeCard = ({ showWelcomeMessage, setShowWelcomeMessage, setMessage, handleSendMessage }) => {
  return (
    <>
      {showWelcomeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 welcome-message-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          {/* Overlay (click to close) */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowWelcomeMessage(false)}
          />
          {/* Centered Card */}
          <div className="welcome-card-container">
            <div className="rounded-2xl animate-slide-down welcome-card relative">
              {/* Minimal header bar */}
              <div className="welcome-card-header"></div>
              
              <button
                onClick={() => setShowWelcomeMessage(false)}
                className="welcome-card-close-btn"
                aria-label="Close"
              >
                <IoClose className="w-4 h-4" />
              </button>

              {/* Simplified Content */}
              <div className="welcome-card-content">
                <div className="welcome-card-icon">
                  <IoRocket className="w-5 h-5 text-white" />
                </div>
                
                <h3 id="welcome-title" className="welcome-card-title">⚡ Build your course instantly.</h3>
                <p className="welcome-card-subtitle">Just type your idea — we'll handle the rest.</p>
                
                {/* Example prompts above button */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {[
                    "Learn Trigonometry",
                    "Python Basics"
                  ].map((sample) => (
                    <button
                      key={sample}
                      onClick={() => {
                        setShowWelcomeMessage(false);
                        setMessage(sample);
                        setTimeout(() => handleSendMessage(sample, { forceProMode: true }), 120);
                      }}
                      className="welcome-card-example-btn"
                    >
                      "{sample}"
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    setShowWelcomeMessage(false);
                    const sample = "Learn Trigonometry";
                    setMessage(sample);
                    setTimeout(() => handleSendMessage(sample, { forceProMode: true }), 120);
                  }}
                  className="welcome-card-cta"
                >
                  Start Creating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewWelcomeCard;