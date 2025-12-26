// Silence all console logs in production for security
// TEMPORARILY DISABLED FOR DEBUGGING MODAL ISSUE
// if (import.meta.env.PROD) {
//   console.log = () => {};
//   console.debug = () => {};
//   console.info = () => {};
//   console.warn = () => {};
//   // Keep console.error for critical issues but you can remove it too
//   // console.error = () => {};
// }

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import tracking from './services/trackingService.js'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'

// Initialize tracking early so session_id is available globally and PostHog is set up
try { tracking.init(); } catch {}

// Initialize pending course notification service
// This will check for any completed courses that were generated in background
// and show notifications when user returns to the site
import { initializeNotificationService } from './services/PendingCourseNotificationService.js';
try { 
  // Slight delay to ensure DOM and other services are ready
  setTimeout(() => initializeNotificationService(), 1000);
} catch (e) { 
  console.warn('Failed to initialize notification service:', e); 
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <PostHogProvider client={posthog}>
        <App />
      </PostHogProvider>
    </HelmetProvider>
  </StrictMode>,
)

// Note: IndexedDB is no longer used for Pro Learning; keeping storage in localStorage only.

// Register Service Worker in production builds to enable SWR caching of course lists
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
