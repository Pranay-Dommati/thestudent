import { useState } from 'react';
import { AnimatedSection } from '../animations';
import { HiAcademicCap, HiCode, HiCheck, HiX, HiChevronDown } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Problems Section - V6 (Mobile Accordion / Desktop Unified)
 * Desktop: "Unified Comparison" Layout (Side-by-side).
 * Mobile: Accordion (Collapsed by default).
 */
const ProblemsSection = () => {
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (id) => {
        setOpenSection(openSection === id ? null : id);
    };

    return (
        <section className="py-24 bg-white border-b border-slate-100">
            <div className="container mx-auto px-5 sm:px-6">

                {/* Main Header */}
                <AnimatedSection className="max-w-4xl mx-auto text-left sm:text-center mb-16 sm:mb-24">
                    <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                        Why Learning Breaks <br className="sm:hidden" />
                        <span className="text-slate-400">for Most Students</span>
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-2xl sm:mx-auto">
                        Traditional systems are built for content delivery. <br />
                        We built a system for <strong>actual understanding.</strong>
                    </p>
                </AnimatedSection>

                <div className="space-y-6 sm:space-y-0 text-left">

                    {/* UNIVERSAL CARD WRAPPER COMPONENT?? No, just inline for simplicity since structure varies slightly */}

                    {/* BLOCK 1: School Students */}
                    <AnimatedSection className="sm:mb-24">
                        <div className="max-w-6xl mx-auto bg-slate-50 rounded-2xl sm:rounded-[2.5rem] p-0 sm:p-12 border border-slate-100 shadow-sm relative overflow-hidden">

                            {/* Accordion Header (Mobile Clickable) */}
                            <div
                                onClick={() => toggleSection('school')}
                                className="p-6 sm:p-0 flex items-center justify-between cursor-pointer sm:cursor-default sm:mb-10 sm:pb-8 sm:border-b sm:border-slate-200/60"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 shadow-sm flex items-center justify-center">
                                        <HiAcademicCap className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">School Students</h3>
                                        <p className="text-slate-500 text-sm">Class 6th – 12th</p>
                                    </div>
                                </div>
                                {/* Mobile Chevron */}
                                <motion.div
                                    animate={{ rotate: openSection === 'school' ? 180 : 0 }}
                                    className="sm:hidden text-slate-400"
                                >
                                    <HiChevronDown className="w-6 h-6" />
                                </motion.div>
                            </div>

                            {/* Content - Collapsible on Mobile, ALWAYS Visible on Desktop */}
                            <div className={`${openSection === 'school' ? 'block' : 'hidden'} sm:block px-6 pb-8 sm:px-0 sm:pb-0`}>
                                <div className="grid md:grid-cols-2 gap-8 lg:gap-20 relative">
                                    {/* Central Divider (Desktop) */}
                                    <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 -ml-px"></div>

                                    {/* Left: The Old Way */}
                                    <div className="space-y-6 sm:space-y-8">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                            Without Structure
                                        </h4>
                                        <ul className="space-y-6">
                                            {[
                                                "Random videos, no syllabus tracking",
                                                "Important topics skipped or skimmed",
                                                "Memorizing without understanding",
                                                "Panic studying before exams"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-4 text-slate-500 group">
                                                    <HiX className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5 group-hover:text-red-500 transition-colors" />
                                                    <span className="leading-relaxed font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Right: The New Way */}
                                    <div className="space-y-6 sm:space-y-8">
                                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            With EasyLearnova
                                        </h4>
                                        <ul className="space-y-6">
                                            {[
                                                "Strict syllabus-aligned structure",
                                                "Clear learning paths per subject",
                                                "Visual concepts that stick",
                                                "Steady, tracked progress"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-4 text-slate-900">
                                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                                                        <HiCheck className="w-3.5 h-3.5 text-blue-600" />
                                                    </div>
                                                    <span className="leading-relaxed font-semibold">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>


                    {/* BLOCK 2: Engineering Students - Unified Card */}
                    <AnimatedSection>
                        <div className="max-w-6xl mx-auto bg-slate-50 rounded-2xl sm:rounded-[2.5rem] p-0 sm:p-12 border border-slate-100 shadow-sm relative overflow-hidden">

                            {/* Accordion Header */}
                            <div
                                onClick={() => toggleSection('eng')}
                                className="p-6 sm:p-0 flex items-center justify-between cursor-pointer sm:cursor-default sm:mb-10 sm:pb-8 sm:border-b sm:border-slate-200/60"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white text-purple-600 shadow-sm flex items-center justify-center">
                                        <HiCode className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Engineering / DSA</h3>
                                        <p className="text-slate-500 text-sm">B.Tech & Interviews</p>
                                    </div>
                                </div>
                                <motion.div
                                    animate={{ rotate: openSection === 'eng' ? 180 : 0 }}
                                    className="sm:hidden text-slate-400"
                                >
                                    <HiChevronDown className="w-6 h-6" />
                                </motion.div>
                            </div>

                            <div className={`${openSection === 'eng' ? 'block' : 'hidden'} sm:block px-6 pb-8 sm:px-0 sm:pb-0`}>
                                <div className="grid md:grid-cols-2 gap-8 lg:gap-20 relative">
                                    {/* Central Divider (Desktop) */}
                                    <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 -ml-px"></div>

                                    {/* Left: The Old Way */}
                                    <div className="space-y-6 sm:space-y-8">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                            Without Visualization
                                        </h4>
                                        <ul className="space-y-6">
                                            {[
                                                "Code runs, but logic feels invisible",
                                                "Tutorials jump straight to solutions",
                                                "Debugging is guess-work",
                                                "Abstract concepts stay abstract"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-4 text-slate-500 group">
                                                    <HiX className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5 group-hover:text-red-500 transition-colors" />
                                                    <span className="leading-relaxed font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Right: The New Way */}
                                    <div className="space-y-6 sm:space-y-8">
                                        <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                            With EasyLearnova
                                        </h4>
                                        <ul className="space-y-6">
                                            {[
                                                "Step-by-step code execution",
                                                "Variables & memory visualized",
                                                "See logic move, not just output",
                                                "Build intuition, not shortcuts"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-4 text-slate-900">
                                                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                                                        <HiCheck className="w-3.5 h-3.5 text-purple-600" />
                                                    </div>
                                                    <span className="leading-relaxed font-semibold">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>

            </div>
        </section>
    );
};

export default ProblemsSection;
