import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster, toast, ToastBar } from 'react-hot-toast'
import posthog from 'posthog-js'
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react'
import './index.css'
import App from './App.jsx'
import LibraryPage from './LibraryPage.jsx'
import InterviewPrepPage from './InterviewPrepPage.jsx'
import GeneratePage from './GeneratePage.jsx'
import SignupPage from './SignupPage.jsx'
import LoginPage from './LoginPage.jsx'
import DashboardPage from './DashboardPage.jsx'
import PricingPage from './PricingPage.jsx'
import ProfilePage from './ProfilePage.jsx'
import TermsPage from './TermsPage.jsx'
import PrivacyPage from './PrivacyPage.jsx'
import SupportPage from './SupportPage.jsx'
import EnterprisePage from './EnterprisePage.jsx'
import TopicPage from './TopicPage.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { HelmetProvider } from 'react-helmet-async'
import PDFViewerPage from './PDFViewerPage.jsx'
import ForgotPasswordPage from './ForgotPasswordPage.jsx'
import ResetPasswordPage from './ResetPasswordPage.jsx'
import GlobalGenerationIndicator from './components/GlobalGenerationIndicator.jsx'
import YoutubeOrganizeIndicator from './components/YoutubeOrganizeIndicator.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import ShareLandingPage from './ShareLandingPage.jsx'
import InfluencerDashboardPage from './InfluencerDashboardPage.jsx'
import InviteRedirect from './InviteRedirect.jsx'

posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-01-30',
})

const rootElement = document.getElementById('root')

const AppContent = (
  <StrictMode>
    <HelmetProvider>
      <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
          <Route path="/" element={<App />} />
          <Route path="/library" element={<LibraryPage />} />
          {/* /previews was the old name for this page — keep the link working. */}
          <Route path="/previews" element={<Navigate to="/library" replace />} />
          <Route path="/interview-prep" element={<InterviewPrepPage />} />
          <Route path="/interview-prep/:slug" element={<InterviewPrepPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/enterprise" element={<EnterprisePage />} />
          <Route path="/view/share/:shareToken" element={<PDFViewerPage />} />
          <Route path="/view/:slug" element={<PDFViewerPage />} />
          <Route path="/view" element={<PDFViewerPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
          <Route path="/topic/:slug" element={<TopicPage />} />
          <Route path="/share/:shareCode" element={<ShareLandingPage />} />
          <Route path="/influencer/:token" element={<InfluencerDashboardPage />} />
          <Route path="/invite/:referralCode" element={<InviteRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <GlobalGenerationIndicator />
        <YoutubeOrganizeIndicator />
      </BrowserRouter>
      <Toaster position="top-center">
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {/* Circular close button — only show on non-loading toasts */}
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    aria-label="Dismiss"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1.5px solid rgba(0,0,0,0.15)',
                      background: 'rgba(0,0,0,0.06)',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: '13px',
                      lineHeight: 1,
                      flexShrink: 0,
                      marginLeft: '4px',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.15)'
                      e.currentTarget.style.color = '#333'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
                      e.currentTarget.style.color = '#888'
                    }}
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </AuthProvider>
      </PostHogErrorBoundary>
      </PostHogProvider>
  </HelmetProvider>
</StrictMode>
)

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, AppContent)
} else {
  createRoot(rootElement).render(AppContent)
}
