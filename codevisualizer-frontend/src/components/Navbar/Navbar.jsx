import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import LogoutConfirmModal from '../common/LogoutConfirmModal';

const Navbar = ({ initialStyle = "light" }) => {
    const { isLoggedIn, logout, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

    // Mobile check
    useEffect(() => {
        const checkScreenSize = () => setIsMobile(window.innerWidth < 1024);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Scroll check
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menus on resize/scroll
    useEffect(() => {
        if (isMobileMenuOpen) {
            window.addEventListener('scroll', () => setIsMobileMenuOpen(false), { passive: true });
        }
    }, [isMobileMenuOpen]);

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        logout();
        setShowLogoutConfirm(false);
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    const cancelLogout = () => setShowLogoutConfirm(false);

    // Simple clean styling for an app-focused navbar
    const isTransparent = initialStyle === 'transparent' && !isScrolled;

    const backgroundClass = isTransparent
        ? 'bg-transparent border-transparent'
        : 'bg-white/95 backdrop-blur-md shadow-sm border-slate-100';

    const mainTextColor = isTransparent ? 'text-white' : 'text-slate-800';
    const logoColor = isTransparent ? 'text-white' : 'text-slate-900';
    const logoAccentColor = isTransparent ? 'text-blue-200' : 'text-blue-600';

    const loginButtonClass = isTransparent
        ? 'text-white hover:bg-white/10 border border-transparent hover:border-white/20'
        : 'text-slate-600 hover:bg-slate-50';

    const signUpButtonClass = isTransparent
        ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg shadow-blue-900/20 border border-transparent'
        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md';

    return (
        <>
            <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${backgroundClass} py-3 border-b`}>
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center">

                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <span className={`font-bold text-2xl ${logoColor} tracking-tight transition-colors`}>
                                Code<span className={`${logoAccentColor} transition-colors`}>Visualizer</span>
                            </span>
                        </Link>

                        {/* Desktop Auth */}
                        <div className="hidden lg:flex items-center space-x-4">
                            {loading ? (
                                <div className="h-10 w-24 bg-slate-100 rounded-full animate-pulse"></div>
                            ) : isLoggedIn ? (
                                <div className="flex items-center space-x-4">
                                    {location.pathname === '/profile' ? (
                                        <button
                                            onClick={handleLogout}
                                            className={`px-5 py-2 rounded-full font-medium transition-all ${isTransparent ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <FaSignOutAlt size={16} />
                                                Logout
                                            </span>
                                        </button>
                                    ) : (
                                        <Link to="/profile">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isTransparent ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                <FaUserCircle size={24} />
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link
                                        to={`/auth?mode=login&returnTo=${encodeURIComponent(location.pathname)}`}
                                        className={`px-5 py-2 rounded-full font-medium transition-colors ${loginButtonClass}`}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to={`/auth?mode=signup&returnTo=${encodeURIComponent(location.pathname)}`}
                                        className={`px-5 py-2 rounded-full font-medium transition-all transform hover:scale-105 ${signUpButtonClass}`}
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Toggle */}
                        <div className="lg:hidden flex items-center">
                            {isLoggedIn ? (
                                location.pathname === '/profile' ? (
                                    <button
                                        onClick={handleLogout}
                                        className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 ${isTransparent ? 'bg-white/10 text-white border border-white/20' : 'bg-slate-100 text-slate-700'}`}
                                    >
                                        <FaSignOutAlt size={14} />
                                        Sign Out
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                        className={`p-2 rounded-full ${isTransparent ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                                    >
                                        <FaUserCircle size={24} className={isTransparent ? 'text-white' : 'text-slate-700'} />
                                    </button>
                                )
                            ) : (
                                <Link
                                    to="/auth?mode=login"
                                    className={`px-4 py-2 rounded-full text-sm font-medium ${isTransparent ? 'bg-white text-blue-600 shadow-lg shadow-blue-900/20' : 'bg-blue-600 text-white'}`}
                                >
                                    Log In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu (Authenticated) */}
                {isMobileMenuOpen && isLoggedIn && (
                    <>
                        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsMobileMenuOpen(false)}></div>
                        <div className="absolute top-16 right-4 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden py-2">
                            <Link
                                to="/profile"
                                className="flex items-center px-4 py-3 text-slate-700 hover:bg-slate-50"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <FaUserCircle className="mr-3 text-slate-400" />
                                View Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 text-left"
                            >
                                <FaSignOutAlt className="mr-3" />
                                Sign Out
                            </button>
                        </div>
                    </>
                )}

                <LogoutConfirmModal
                    isOpen={showLogoutConfirm}
                    onConfirm={confirmLogout}
                    onCancel={cancelLogout}
                />
            </nav>
            {/* Spacer for fixed navbar - Only show if NOT transparent */}
            {!isTransparent && <div className="h-16"></div>}
        </>
    );
};

export default Navbar;