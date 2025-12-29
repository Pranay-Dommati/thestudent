import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaGraduationCap, FaCog, FaSignOutAlt, FaBell,
    FaUserCircle, FaShieldAlt, FaHistory, FaDownload
} from 'react-icons/fa';

const ProfileNavbar = ({ isDarkMode, profileData, setActiveTab }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const profileActions = [
        { icon: FaUserCircle, label: 'View Profile', action: () => { } },
        { icon: FaShieldAlt, label: 'Privacy Settings', action: () => { } },
        { icon: FaHistory, label: 'Activity Log', action: () => { } },
        { icon: FaDownload, label: 'Download Data', action: () => { } },
        { icon: FaSignOutAlt, label: 'Sign Out', action: () => { }, className: 'text-red-500' }
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            } border-b shadow-sm`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo - Now acts as home button */}
                    <Link
                        to="/"
                        className="flex items-center transition-opacity hover:opacity-80"
                    >
                        <span className={`font-bold text-2xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Code<span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>Visualizer</span>
                        </span>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default ProfileNavbar;