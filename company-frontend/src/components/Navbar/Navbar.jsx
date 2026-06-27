import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineAcademicCap, HiOutlineCode, HiOutlineDocumentText, HiMenu, HiX } from 'react-icons/hi';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Navbar V4 - Scrib-first Navbar
 * Desktop: Scrib (primary), Courses, Code Visualizer.
 * Mobile: Logo + Hamburger → Right Side Drawer.
 */
const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMenuOpen]);

    return (
        <>
            <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">

                    {/* Left: Logo */}
                    <Link to="/" className="flex items-center gap-2 group z-50 relative">
                        <span className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            EasyLearnova
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a
                            href="https://scrib.easylearnova.com"
                            className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-amber-600 transition-colors"
                        >
                            <HiOutlineDocumentText className="w-5 h-5" />
                            Scrib
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">New</span>
                        </a>

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

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-slate-900 z-50 relative"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
                    </button>

                </div>
            </nav>

            {/* Mobile Drawer - Right Side */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] md:hidden"
                        />

                        {/* Right Side Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[80%] max-w-[320px] bg-white shadow-2xl z-[70] md:hidden p-8"
                        >
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-xl font-bold text-slate-900">EasyLearnova</span>
                                    <button
                                        onClick={() => setIsMenuOpen(false)}
                                        className="p-2 -mr-2 text-slate-500 hover:text-slate-900"
                                    >
                                        <HiX className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-3 flex-1">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Products</div>
                                    <a
                                        href="https://scrib.easylearnova.com"
                                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 text-white font-semibold"
                                    >
                                        <HiOutlineDocumentText className="w-6 h-6 text-amber-300" />
                                        <span>Scrib</span>
                                        <span className="ml-auto text-[10px] font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full uppercase">New</span>
                                    </a>
                                    <a
                                        href="https://courses.easylearnova.com"
                                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 text-slate-900 font-semibold active:bg-slate-100"
                                    >
                                        <HiOutlineAcademicCap className="w-6 h-6 text-blue-600" />
                                        School Courses
                                    </a>
                                    <a
                                        href="https://codevisualizer.easylearnova.com"
                                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 text-slate-900 font-semibold active:bg-slate-100"
                                    >
                                        <HiOutlineCode className="w-6 h-6 text-purple-600" />
                                        Code Visualizer
                                    </a>
                                </div>

                                <div className="h-px bg-slate-100 my-6" />

                                <div className="flex flex-col gap-4">
                                    <Link to="/privacy-policy" className="text-sm text-slate-500 font-medium hover:text-slate-900">Privacy Policy</Link>
                                    <Link to="/terms-and-conditions" className="text-sm text-slate-500 font-medium hover:text-slate-900">Terms & Conditions</Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;