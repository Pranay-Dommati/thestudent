/**
 * Fixed Google Auth Implementation for AuthForm.jsx
 * This addresses common Google Sign-In issues
 */

import React, { useState, useEffect } from 'react';
import universalToast from '../utils/universalToast';

// Enhanced Google Sign-In Hook
export const useGoogleAuth = (onSuccess, onError, onShown) => {
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  // Basic mobile/iOS Safari detection for auth UX adjustments
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iP(hone|od|ad)/i.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(ua);
  const isMobileSafari = isMobile && isSafari;

  useEffect(() => {
    // Handle Google authentication response
    const handleGoogleResponse = async (response) => {
      try {
        console.log('Google Sign-In response received');
        
        if (!response.credential) {
          throw new Error('No credential received from Google');
        }

        // Call the success callback with the credential
        await onSuccess(response.credential);
        
      } catch (error) {
        console.error('Google authentication error:', error);
        onError(error.message || 'Google authentication failed');
      }
    };

    // Load Google Identity Services if not already loaded
    const loadGoogleScript = () => {
      return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }

        const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        if (existingScript) {
          existingScript.onload = resolve;
          existingScript.onerror = reject;
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
        document.head.appendChild(script);
      });
    };

    // Initialize Google Sign-In
    const initializeGoogle = async () => {
      try {
        setIsLoading(true);
        
        if (!GOOGLE_CLIENT_ID) {
          console.error('VITE_GOOGLE_CLIENT_ID not found in environment variables');
          universalToast.error('Google Sign-In not configured');
          return;
        }

        await loadGoogleScript();
        
        // Handle CSP errors gracefully
        const originalConsoleError = console.error;
        console.error = (...args) => {
          // Filter out the specific CSP error for Google framing
          const message = args.join(' ');
          if (message.includes("Refused to frame 'https://www.google.com/'") || 
              message.includes('frame-ancestors') ||
              message.includes('Content Security Policy directive')) {
            // This is expected behavior - Google prevents their site from being framed
            return;
          }
          originalConsoleError.apply(console, args);
        };
        
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          // Enable FedCM on mobile Safari for better reliability
          use_fedcm_for_prompt: isMobileSafari ? true : false,
          ux_mode: 'popup', // Use popup mode to avoid iframe issues
          context: 'signin', // Specify context
        });

        // Restore original console.error after a delay
        setTimeout(() => {
          console.error = originalConsoleError;
        }, 2000);

        setIsGoogleReady(true);
        setIsLoading(false);
        console.log('Google Sign-In initialized successfully');
      } catch (error) {
        console.error('Google Sign-In initialization failed:', error);
        universalToast.error('Google Sign-In failed to load');
      }
    };

    initializeGoogle();
  }, [GOOGLE_CLIENT_ID, onSuccess, onError]);

  // Trigger Google Sign-In
  const signInWithGoogle = () => {
    if (!isGoogleReady) {
  universalToast.error('Google Sign-In not ready. Please refresh the page.');
      return;
    }

    try {
      // Use prompt method for better compatibility
      window.google.accounts.id.prompt((notification) => {
        try {
          // If the Google prompt is displayed, inform caller to hide loading
          if ((notification.isDisplayed && notification.isDisplayed()) || (notification.isDisplayMoment && notification.isDisplayMoment())) {
            onShown && onShown();
          }
        } catch {}
        if (notification.isNotDisplayed && notification.isNotDisplayed()) {
          console.log('Google Sign-In prompt not displayed, trying fallback method');
          // Fallback: try rendering a button and clicking it programmatically
          renderGoogleButtonAndClick({ visibleOnMobile: true });
          renderGoogleButtonAndClick();
        } else if (notification.isSkippedMoment && notification.isSkippedMoment()) {
          console.log('Google Sign-In prompt skipped');
          universalToast.error('Google Sign-In was cancelled');
          try { onError && onError('Google Sign-In cancelled'); } catch {}
        } else if (notification.isDismissedMoment && notification.isDismissedMoment()) {
          console.log('Google Sign-In popup dismissed/closed by user');
          // Reset loading state when user closes the popup
          try { onError && onError('Google Sign-In dismissed'); } catch {}
        }
      });
    } catch (error) {
      console.error('Failed to show Google Sign-In:', error);
  universalToast.error('Failed to start Google Sign-In');
      try { onError && onError(error); } catch {}
    }
  };

  // Fallback method: render invisible button and click it
  const renderGoogleButtonAndClick = () => {
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-9999px';
      tempContainer.id = 'temp-google-signin';
      document.body.appendChild(tempContainer);

      window.google.accounts.id.renderButton(tempContainer, {
        theme: 'outline',
        size: 'medium',
        type: 'standard',
        width: 250
      });

      // Click the rendered button
      setTimeout(() => {
        const button = tempContainer.querySelector('div[role="button"]');
        if (button) {
          try { onShown && onShown(); } catch {}
          button.click();
        } else {
          universalToast.error('Google Sign-In button could not be rendered');
          try { onError && onError('Google Sign-In button could not be rendered'); } catch {}
        }
        // Clean up
        document.body.removeChild(tempContainer);
      }, 100);
    } catch (error) {
      console.error('Fallback Google Sign-In failed:', error);
  universalToast.error('Google Sign-In is temporarily unavailable');
      try { onError && onError(error); } catch {}
    }
  };

  return {
    isGoogleReady,
    isLoading,
    signInWithGoogle
  };
};

// Usage in AuthForm component:
export const GoogleSignInButton = ({ onSuccess, onError, onStart, onShown, disabled = false }) => {
  const { isGoogleReady, isLoading, signInWithGoogle } = useGoogleAuth(onSuccess, onError, onShown);
  const [timeoutId, setTimeoutId] = React.useState(null);

  const handleClick = () => {
    try {
      onStart && onStart();
    } catch {}
    
    signInWithGoogle();
    
    // Safety timeout: if nothing happens within 30 seconds, reset loading state
    const id = setTimeout(() => {
      console.log('Google Sign-In timeout - resetting state');
      try {
        onError && onError('Google Sign-In timeout');
      } catch {}
    }, 30000);
    setTimeoutId(id);
  };

  // Clear timeout when component unmounts or when loading completes
  React.useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !isGoogleReady}
      className="w-full flex justify-center items-center py-4 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
      aria-label="Continue with Google"
    >
      <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {isLoading ? 'Loading...' : (isGoogleReady ? 'Continue with Google' : 'Google Sign-In Unavailable')}
    </button>
  );
};