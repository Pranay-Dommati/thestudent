import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import PreviewsPage from './PreviewsPage.jsx'
import GeneratePage from './GeneratePage.jsx'
import SignupPage from './SignupPage.jsx'
import LoginPage from './LoginPage.jsx'
import DashboardPage from './DashboardPage.jsx'
import PricingPage from './PricingPage.jsx'
import ProfilePage from './ProfilePage.jsx'
import TermsPage from './TermsPage.jsx'
import PrivacyPage from './PrivacyPage.jsx'
import TopicPage from './TopicPage.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { HelmetProvider } from 'react-helmet-async'
import PDFViewerPage from './PDFViewerPage.jsx'
import ForgotPasswordPage from './ForgotPasswordPage.jsx'
import ResetPasswordPage from './ResetPasswordPage.jsx'
import GlobalGenerationIndicator from './components/GlobalGenerationIndicator.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

const rootElement = document.getElementById('root')

const AppContent = (
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
          <Route path="/" element={<App />} />
          <Route path="/previews" element={<PreviewsPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/view/share/:shareToken" element={<PDFViewerPage />} />
          <Route path="/view/:slug" element={<PDFViewerPage />} />
          <Route path="/view" element={<PDFViewerPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
          <Route path="/topic/:slug" element={<TopicPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <GlobalGenerationIndicator />
      </BrowserRouter>
      <Toaster position="top-center" />
    </AuthProvider>
  </HelmetProvider>
</StrictMode>
)

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, AppContent)
} else {
  createRoot(rootElement).render(AppContent)
}
