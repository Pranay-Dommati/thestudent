// Silence all console logs in production for security
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  // Keep console.error for critical issues but you can remove it too
  // console.error = () => {};
}

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
