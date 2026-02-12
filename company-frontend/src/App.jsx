import './App.css';
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import Navbar from './components/Navbar/Navbar';
import AdminDashboard from './components/Admin/Dashboard/AdminDashboard';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import NotFound from './components/NotFound/NotFound';
import AdminForgotPassword from './components/Admin/AdminForgotPassword';
import AdminResetPassword from './components/Admin/AdminResetPassword';
import TermsAndConditions from './components/Legal/TermsAndConditions';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import './utils/axios';
import ScrollManager from './components/Common/ScrollManager.jsx';
import OnlineStatusToaster from './components/Common/OnlineStatusToaster.jsx';
import OfflineRouterHandler from './components/Common/OfflineRouterHandler.jsx';
import OfflinePage from './components/Common/OfflinePage.jsx';

const Layout = ({ children, excludePaths = [] }) => {
    const location = useLocation();

    // Check if the current route is in the excludePaths array
    const isExcluded = excludePaths.some(path => location.pathname.startsWith(path));

    // Determine the navbar style based on the current route
    const getNavbarStyle = () => {
        // Light navbar for legal pages
        if (location.pathname.startsWith('/terms') ||
            location.pathname.startsWith('/privacy')) {
            return 'light';
        }

        // Default to transparent for other pages (Homepage)
        return 'transparent';
    };

    return (
        <>
            {/* Desktop Navigation */}
            {!isExcluded && <Navbar initialStyle={getNavbarStyle()} />}

            <div className="min-h-screen">
                {children}
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
                    toastOptions={{
                        duration: Infinity,
                        style: {
                            background: 'transparent',
                            color: 'inherit',
                            padding: '0',
                            margin: '0',
                            borderRadius: '0',
                            boxShadow: 'none',
                            maxWidth: 'none',
                            border: 'none',
                            width: 'auto',
                            minWidth: 'auto',
                        },
                        success: {
                            duration: Infinity,
                            style: {
                                background: 'transparent',
                                color: 'inherit',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                boxShadow: 'none',
                                border: 'none',
                                width: 'auto',
                                minWidth: 'auto',
                            },
                        },
                        error: {
                            duration: Infinity,
                            style: {
                                background: 'transparent',
                                color: 'inherit',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                boxShadow: 'none',
                                border: 'none',
                                width: 'auto',
                                minWidth: 'auto',
                            },
                        },
                    }}
                    containerStyle={{
                        top: '20px',
                        right: '20px',
                    }}
                    containerClassName="toast-container"
                />
                <BrowserRouter>
                    <ScrollManager />
                    {/* Global online/offline toast notifications */}
                    <OnlineStatusToaster />
                    {/* Auto-route to /offline when disconnected and back when restored */}
                    <OfflineRouterHandler />

                    <Layout excludePaths={['/admin-p', '/offline', '/terms', '/privacy']}>
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                {/* Offline fallback page */}
                                <Route path="/offline" element={<OfflinePage />} />

                                {/* Admin Routes */}
                                <Route path="/admin-p/*" element={<AdminDashboard />} />
                                <Route path="/admin-p/forgot-password" element={<AdminForgotPassword />} />
                                <Route path="/admin-p/reset-password/:uid/:token" element={<AdminResetPassword />} />

                                {/* Other Routes */}
                                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                                <Route path="/terms" element={<Navigate to="/terms-and-conditions" />} />
                                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                <Route path="/privacy" element={<Navigate to="/privacy-policy" />} />

                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </Layout>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;