import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import tracking from './services/trackingService.js'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import App from './App.jsx'

// Initialize tracking early so session_id is available globally and PostHog is set up
try { tracking.init(); } catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
)

// Note: IndexedDB is no longer used for Pro Learning; keeping storage in localStorage only.
