import './App.css';
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './utils/axios';

// Essential Components
import Navbar from './components/Navbar/Navbar';
import AuthForm from './components/Auth/AuthForm';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import NotFound from './components/NotFound/NotFound';
import Footer from './components/Footer/Footer';

// Code Visualizer
const CodeVisualizerPage = React.lazy(() => import('./components/CodeVisualizer'));
const DevSandbox = React.lazy(() => import('./components/CodeVisualizer/DevSandbox'));
const ProfilePage = React.lazy(() => import('./components/Profile/ProfilePageNew'));
const Feedback = React.lazy(() => import('./components/Feedback/FeedbackPage'));
const TermsAndConditions = React.lazy(() => import('./components/Legal/TermsAndConditions'));
const PrivacyPolicy = React.lazy(() => import('./components/Legal/PrivacyPolicy'));

// DSA Sheet
const DSAProblemPage = React.lazy(() => import('./pages/DSAProblemPage'));

const Layout = ({ children }) => {
    const location = useLocation();

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    // Minimal navbar logic - show on everything except pure auth pages if desired, 
    // or maybe specific layout requirements. 
    // For now, keeping a simple check to hide nav on specific full-screen views if needed.
    const hideNav = location.pathname.startsWith('/auth') || location.pathname.startsWith('/dsa-sheet');

    // Use transparent navbar on homepage and code-visualizer, light on others
    const isHomePage = location.pathname === '/' || location.pathname === '/code-visualizer';
    const navStyle = isHomePage ? 'transparent' : 'light';

    // Hide navbar on mobile for homepage (has its own mobile header)
    const hideNavOnMobile = isHomePage;

    return (
        <>
            {!hideNav && (
                <div className={hideNavOnMobile ? 'hidden lg:block' : ''}>
                    <Navbar initialStyle={navStyle} />
                </div>
            )}
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <main className="flex-grow">
                    {children}
                </main>
                {/* Hide footer on mobile for homepage */}
                {!hideNav && (
                    <div className={hideNavOnMobile ? 'hidden lg:block' : ''}>
                        <Footer />
                    </div>
                )}
            </div>
        </>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Toaster
                    position="top-right"
                    containerStyle={{ top: '20px', right: '20px' }}
                />
                <BrowserRouter>
                    <Layout>
                        <Suspense fallback={
                            <div className="min-h-screen flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        }>
                            <Routes>
                                {/* Main Product Route */}
                                <Route path="/" element={<CodeVisualizerPage />} />
                                <Route path="/code-visualizer" element={<Navigate to="/" replace />} />

                                {/* Auth Routes */}
                                <Route path="/auth" element={<AuthForm />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="/feedback" element={<Feedback />} />
                                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                                <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                                {/* DSA Sheet Routes */}
                                <Route path="/dsa-sheet/:problemName" element={<DSAProblemPage />} />

                                {/* Dev Tools */}
                                <Route path="/dev-sandbox" element={
                                    import.meta.env.DEV
                                        ? <DevSandbox />
                                        : <Navigate to="/" replace />
                                } />

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </Layout>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;