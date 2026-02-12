import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaSearch, FaBell, FaUser, FaTimes, FaHome, FaGraduationCap,
    FaBook, FaAward, FaCog, FaSignOutAlt, FaBookOpen, FaChartLine,
    FaHeart, FaHistory, FaQuestionCircle, FaPhone, FaEllipsisV
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

const MobileNavigation = ({ showSearch = true, showNotifications = true }) => {
    const { isLoggedIn, logout, user, loading } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        navigate('/');
    };

    const navigationItems = [
        { path: '/', icon: FaHome, label: 'Home' },
        { path: '/courses', icon: FaGraduationCap, label: 'Courses' },
        { path: '/learning-path', icon: FaBook, label: 'Creator' },
        ...(isLoggedIn ? [{ path: '/learning-hub', icon: FaAward, label: 'Hub' }] : []),
        { path: isLoggedIn ? '/profile' : '/auth?mode=login', icon: FaUser, label: isLoggedIn ? 'Profile' : 'Login' }
    ];

    const menuItems = [
        ...(isLoggedIn ? [
            { path: '/profile', icon: FaUser, label: 'Profile', description: 'Manage your account' },
            { path: '/learning-hub', icon: FaAward, label: 'Learning Hub', description: 'Your saved courses' },
            { path: '/progress', icon: FaChartLine, label: 'Progress', description: 'Track your learning' },
            { path: '/favorites', icon: FaHeart, label: 'Favorites', description: 'Liked courses' },
            { path: '/history', icon: FaHistory, label: 'History', description: 'Recent activity' },
        ] : [
            { path: '/auth?mode=login', icon: FaUser, label: 'Sign In', description: 'Access your account' },
            { path: '/auth?mode=signup', icon: FaGraduationCap, label: 'Sign Up', description: 'Create new account' },
        ]),
        { path: '/courses', icon: FaBookOpen, label: 'All Courses', description: 'Browse our catalog' },
        { path: '/learning-path', icon: FaBook, label: 'Learn Smarter', description: 'Smart course creation' },
        { path: '/help', icon: FaQuestionCircle, label: 'Help & Support', description: 'Get assistance' },
        { path: '/contact', icon: FaPhone, label: 'Contact Us', description: 'Get in touch' },
    ];

    return (
        <>
            {/* Top Status Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs py-1 px-4 flex justify-between items-center">
                <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    AI-Powered Learning
                </span>
                <div className="flex items-center space-x-2">
                    <HiSparkles className="w-3 h-3" />
                    <span>100k+ Students</span>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="bg-white shadow-lg sticky top-0 z-50">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-sm">E</span>
                            </div>
                            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                EasyLearnova
                            </span>
                        </Link>

                        {/* Right Actions */}
                        <div className="flex items-center space-x-3">
                            {loading ? (
                                // Skeleton loader while checking auth state
                                <>
                                    {showSearch && (
                                        <div className="w-9 h-9 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
                                        </div>
                                    )}
                                    <div className="w-9 h-9 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {showSearch && (
                                        <button
                                            onClick={() => setIsSearchOpen(true)}
                                            className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            <FaSearch className="w-4 h-4 text-gray-600" />
                                        </button>
                                    )}

                                    {isLoggedIn && showNotifications && (
                                        <button className="p-2 bg-gray-100 rounded-xl relative hover:bg-gray-200 transition-colors">
                                            <FaBell className="w-4 h-4 text-gray-600" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setIsMenuOpen(true)}
                                        className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        <FaEllipsisV className="w-5 h-5 text-gray-600" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Overlay */}
                {isSearchOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-start pt-4">
                        <div className="bg-white w-full mx-4 rounded-2xl p-4 max-h-96 overflow-y-auto">
                            <div className="flex items-center space-x-3 mb-4">
                                <FaSearch className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search courses, topics, subjects..."
                                    className="flex-1 text-lg font-medium outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={() => setIsSearchOpen(false)}
                                    className="text-gray-500 text-sm font-medium px-3 py-1 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-gray-500 font-medium mb-2">Popular searches</div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Python', 'Math Class 10', 'Physics', 'Chemistry', 'AI'].map((term, index) => (
                                            <button
                                                key={index}
                                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500 font-medium mb-2">Recent searches</div>
                                    {['Python Programming', 'Class 10 Math', 'AI Fundamentals'].map((term, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl">
                                            <FaHistory className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-700">{term}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu Overlay */}
                {isMenuOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50">
                        <div className="bg-white h-full w-80 max-w-full ml-auto p-6 overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    {isLoggedIn ? (
                                        <>
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                <FaUser className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">Welcome back!</div>
                                                <div className="text-sm text-gray-600">{user?.email || 'Student'}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                <span className="text-white font-bold">S</span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">EasyLearnova</div>
                                                <div className="text-sm text-gray-600">Your learning companion</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl"
                                >
                                    <FaTimes className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <div className="space-y-2 mb-6">
                                {menuItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl group"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100">
                                            <item.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{item.label}</div>
                                            <div className="text-sm text-gray-600">{item.description}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Settings and Logout */}
                            {isLoggedIn && (
                                <div className="border-t border-gray-200 pt-4 space-y-2">
                                    <Link
                                        to="/settings"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl"
                                    >
                                        <FaCog className="w-5 h-5 text-gray-600" />
                                        <span className="font-medium text-gray-900">Settings</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-3 p-3 hover:bg-red-50 rounded-xl w-full text-left"
                                    >
                                        <FaSignOutAlt className="w-5 h-5 text-red-600" />
                                        <span className="font-medium text-red-600">Sign Out</span>
                                    </button>
                                </div>
                            )}

                            {/* App Version */}
                            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                                <div className="text-xs text-gray-500">
                                    EasyLearnova v2.0
                                    <br />
                                    Made with ❤️ for students
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Bottom Tab Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 md:hidden">
                <div className="flex justify-around items-center">
                    {loading ? (
                        // Skeleton loaders for bottom nav while checking auth state
                        <>
                            {[1, 2, 3, 4, 5].map((index) => (
                                <div key={index} className="flex flex-col items-center py-2 px-3 space-y-2">
                                    <div className="w-5 h-5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
                                    </div>
                                    <div className="w-10 h-2 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        navigationItems.map((item, index) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={index}
                                    to={item.path}
                                    className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${isActive
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5 mb-1" />
                                    <span className="text-xs font-medium">{item.label}</span>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};

export default MobileNavigation;
