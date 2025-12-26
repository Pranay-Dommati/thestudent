import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import tracking from './services/trackingService.js'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'

// Initialize tracking early so session_id is available globally and PostHog is set up
try { tracking.init(); } catch { }

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <HelmetProvider>
            <PostHogProvider client={posthog}>
                <App />
            </PostHogProvider>
        </HelmetProvider>
    </StrictMode>,
)

// Register Service Worker in production builds
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => { });
    });
}
