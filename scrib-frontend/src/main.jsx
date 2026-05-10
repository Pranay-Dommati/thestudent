import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import PreviewsPage from './PreviewsPage.jsx'
import GeneratePage from './GeneratePage.jsx'
import SignupPage from './SignupPage.jsx'
import LoginPage from './LoginPage.jsx'
import DashboardPage from './DashboardPage.jsx'
import PricingPage from './PricingPage.jsx'
import ProfilePage from './ProfilePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/previews" element={<PreviewsPage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
