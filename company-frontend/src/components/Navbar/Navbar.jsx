import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineAcademicCap, HiOutlineCode } from 'react-icons/hi';

/**
 * Navbar V3 - Minimal "Company" Navbar
 * 
 * Goal: "Where can I go from here?" informational navigation.
 * No app logic, no dashboards, no auth state.
 * 
 * Links:
 * - Left: Logo (EasyLearnova)
 * - Right: School Courses (External), Code Visualizer (External)
 * - Removed: About, Contact (per user request)
 */
const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">

                {/* Left: Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        EasyLearnova
                    </span>
                </Link>

                {/* Right: Navigation Links */}
                <div className="flex items-center gap-6 sm:gap-8">
                    {/* Product Links */}
                    <a
                        href="https://courses.easylearnova.com"
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        <HiOutlineAcademicCap className="w-5 h-5" />
                        Courses
                    </a>

                    <a
                        href="https://codevisualizer.easylearnova.com"
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors"
                    >
                        <HiOutlineCode className="w-5 h-5" />
                        Code Visualizer
                    </a>
                </div>

            </div>
        </nav>
    );
};

export default Navbar;