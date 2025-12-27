import LogoutConfirmModal from '../common/LogoutConfirmModal';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaSearch, FaBell, FaBars, FaTimes, FaSignOutAlt, FaArrowLeft
} from 'react-icons/fa';

const MobileTopNavbar = () => {
    const { isLoggedIn, logout, user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Show confirmation dialog instead of logging out immediately
    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        try {
            logout();
        } finally {
            setShowLogoutConfirm(false);
            setIsMenuOpen(false);
            navigate('/');
        }
    };

    const cancelLogout = () => setShowLogoutConfirm(false);

    // Close with ESC key
    useEffect(() => {
        if (!showLogoutConfirm) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') cancelLogout();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showLogoutConfirm]);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'EasyLearnova';
        if (path === '/courses') return 'Courses';
        if (path.startsWith('/6th')) return '6th Standard';
        if (path.startsWith('/7th')) return '7th Standard';
        if (path.startsWith('/8th')) return '8th Standard';
        if (path.startsWith('/9th')) return '9th Standard';
        if (path.startsWith('/10th')) return '10th Standard';
        if (path.startsWith('/11th')) return '11th Standard';
        if (path.startsWith('/12th')) return '12th Standard';
        if (path.startsWith('/engineering')) return 'Engineering';
        if (path.startsWith('/learning-path')) return 'Learn Smarter';
        if (path.startsWith('/learning-hub')) return 'Learning Hub';
        if (path.startsWith('/profile')) return 'Profile';
        if (path.startsWith('/auth')) return 'Sign In';
        // Only mark as "Learning" for course learning routes, not for "/learning-hub"
        // Updated regex to match /:courseId/learning pattern while avoiding exclusion of valid paths
        if (/^\/[^\/]+\/learning(\/|$)/.test(path) && !path.startsWith('/learning-hub') && !path.startsWith('/learning-path')) return 'Learning';
        return 'EasyLearnova';
    };

    const shouldShowBackButton = () => {
        const path = location.pathname;
        return path !== '/' &&
            path !== '/courses' &&
            path !== '/learning-path' &&
            path !== '/learning-hub' &&
            path !== '/profile' &&
            !path.startsWith('/auth');
    };

    const goBack = () => {
        navigate(-1);
    };

    return (
        <>
            {/* Mobile Top Navbar */}
            <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 md:hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2">
                    {/* Left: Logo/Back Button and Page Title */}
                    <div className="flex items-center space-x-2">
                        {shouldShowBackButton() ? (
                            <button
                                onClick={goBack}
                                className="p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95"
                            >
                                <FaArrowLeft className="w-4 h-4 text-gray-600" />
                            </button>
                        ) : (
                            <Link to="/" className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold text-sm">S</span>
                                </div>
                            </Link>
                        )}

                        <div className="flex flex-col">
                            <span className="font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                                {getPageTitle()}
                            </span>
                            {location.pathname !== '/' && !shouldShowBackButton() && (
                                <span className="text-xs text-gray-500 -mt-0.5">EasyLearnova</span>
                            )}
                        </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center space-x-1">
                        {/* Search Button */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95"
                        >
                            <FaSearch className="w-4 h-4 text-gray-600" />
                        </button>

                        {/* Notifications (for logged in users) */}
                        {isLoggedIn && (
                            <button className="p-2 bg-gray-50 rounded-lg relative hover:bg-gray-100 transition-all duration-200 active:scale-95">
                                <FaBell className="w-4 h-4 text-gray-600" />
                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                            </button>
                        )}

                        {/* Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95"
                        >
                            <FaBars className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-start pt-20 md:hidden backdrop-blur-sm">
                    <div className="bg-white w-full mx-4 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="flex-1 relative">
                                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search courses, topics, subjects..."
                                        className="w-full pl-12 pr-4 py-4 text-lg bg-gray-50 rounded-2xl border-none outline-none focus:bg-white focus:shadow-lg transition-all duration-300"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={() => setIsSearchOpen(false)}
                                    className="px-4 py-4 text-blue-600 font-semibold hover:bg-blue-50 rounded-2xl transition-all duration-200"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="text-sm text-gray-500 font-semibold mb-3 uppercase tracking-wide">Popular searches</div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Python', 'Math Class 10', 'Physics', 'Chemistry', 'AI'].map((term, index) => (
                                            <button
                                                key={index}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-2xl text-sm font-medium hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 font-semibold mb-3 uppercase tracking-wide">Quick Actions</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200">
                                            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                                                <span className="text-purple-600 text-sm font-bold">📚</span>
                                            </div>
                                            <span className="text-gray-700 font-medium">Browse Courses</span>
                                        </button>
                                        <button className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200">
                                            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                                                <span className="text-green-600 text-sm font-bold">🤖</span>
                                            </div>
                                            <span className="text-gray-700 font-medium">AI Help</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Side Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm">
                    <div className="bg-white h-full w-80 max-w-full ml-auto shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="p-6 overflow-y-auto h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-3">
                                    {isLoggedIn ? (
                                        <>
                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <span className="text-white font-bold text-xl">
                                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-lg">Welcome back!</div>
                                                <div className="text-sm text-gray-600">{user?.email || 'Student'}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <span className="text-white font-bold text-xl">E</span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-lg">EasyLearnova</div>
                                                <div className="text-sm text-gray-600">Your learning companion</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200 active:scale-95"
                                >
                                    <FaTimes className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <div className="space-y-3 mb-6">
                                {isLoggedIn ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 group"
                                        >
                                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                <span className="text-blue-600 text-lg">👤</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">Profile</div>
                                                <div className="text-sm text-gray-500">Manage your account</div>
                                            </div>
                                        </Link>
                                        <Link
                                            to="/learning-hub"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 group"
                                        >
                                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                                <span className="text-orange-600 text-lg">🎯</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">Learning Hub</div>
                                                <div className="text-sm text-gray-500">Your saved courses</div>
                                            </div>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to={`/auth?mode=login&returnTo=${encodeURIComponent(window.location.pathname + (window.location.search || '') + (window.location.hash || ''))}`}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 group"
                                        >
                                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                                <span className="text-green-600 text-lg">🔑</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">Sign In</div>
                                                <div className="text-sm text-gray-500">Access your account</div>
                                            </div>
                                        </Link>
                                        <Link
                                            to={`/auth?mode=signup&returnTo=${encodeURIComponent(window.location.pathname + (window.location.search || '') + (window.location.hash || ''))}`}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 group"
                                        >
                                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                                <span className="text-purple-600 text-lg">✨</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">Sign Up</div>
                                                <div className="text-sm text-gray-500">Create new account</div>
                                            </div>
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Logout for logged in users */}
                            {isLoggedIn && (
                                <div className="border-t border-gray-200 pt-6">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-4 p-4 hover:bg-red-50 rounded-2xl w-full text-left transition-all duration-200 group"
                                    >
                                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                            <FaSignOutAlt className="w-5 h-5 text-red-600" />
                                        </div>
                                        <span className="font-semibold text-red-600">Sign Out</span>
                                    </button>
                                </div>
                            )}

                            {/* App Version */}
                            <div className="mt-auto pt-6 border-t border-gray-200 text-center">
                                <div className="text-xs text-gray-400">
                                    EasyLearnova v2.0
                                    <br />
                                    Made with ❤️ for students
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal (mobile via shared component with portal) */}
            <LogoutConfirmModal
                isOpen={showLogoutConfirm}
                onConfirm={confirmLogout}
                onCancel={cancelLogout}
            />
        </>
    );
};

export default MobileTopNavbar;
