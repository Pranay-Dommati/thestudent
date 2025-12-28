import { Link } from 'react-router-dom';
import { HiAcademicCap, HiCode } from 'react-icons/hi';
import { AnimatedSection } from '../animations';

/**
 * Hero Section - V3
 * "Learning Systems Company" positioning.
 * No AI hype. Clear, product-first routing.
 * Replaced emojis with icons.
 */
const HeroSection = () => {
    return (
        <AnimatedSection className="relative min-h-[90vh] flex items-center justify-center bg-white overflow-hidden">
            {/* Subtle grid pattern background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="container mx-auto px-6 py-20 relative z-10">
                <div className="max-w-4xl mx-auto text-center sm:text-center text-left">

                    {/* Main heading: Distinct Mobile vs Desktop Layouts */}

                    {/* MOBILE: Industry Standard Structure (Left aligned, 3 layers) */}
                    <div className="sm:hidden text-left">
                        {/* 1. Headline */}
                        <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
                            Structured Learning,<br />Built for Students.
                        </h1>

                        {/* 2. Scope Block (Compact List) */}
                        <ul className="text-base text-slate-600 space-y-2 mb-4">
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                Syllabus-aligned courses for schools
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                Visual code understanding for engineers
                            </li>
                        </ul>

                        {/* 3. Tagline (Brand Statement) */}
                        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                            EasyLearnova builds focused learning systems for real understanding.
                        </p>
                    </div>

                    {/* DESKTOP: Balanced (Equal Weight) - UNCHANGED */}
                    <h1 className="hidden sm:block text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-wide">
                        <span className="block">Structured Learning for School Students.</span>
                        <span className="block">Visual Code Understanding for Engineers.</span>
                    </h1>

                    {/* Subheading (Desktop Only now, since Mobile has its own Tagline) */}
                    <p className="hidden sm:block text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                        EasyLearnova builds focused learning systems for real understanding.
                    </p>

                    {/* CTA Buttons - Mobile: Vertical Stack, Desktop: Horizontal */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-6">
                        <a
                            href="https://courses.easylearnova.com"
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-medium rounded-2xl sm:rounded-lg hover:scale-[1.02] transition-transform duration-200 flex items-center justify-center gap-3 shadow-lg group"
                        >
                            <HiAcademicCap className="w-6 h-6 sm:w-5 sm:h-5 text-blue-200" />
                            <span className="text-lg sm:text-base">School Courses</span>
                        </a>
                        <a
                            href="https://codevisualizer.easylearnova.com"
                            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-medium rounded-2xl sm:rounded-lg border border-slate-200 hover:border-slate-300 hover:scale-[1.02] transition-all duration-200 shadow-sm flex items-center justify-center gap-3"
                        >
                            <HiCode className="w-6 h-6 sm:w-5 sm:h-5 text-purple-600" />
                            <span className="text-lg sm:text-base">Code Visualizer</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Fade to content */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </AnimatedSection>
    );
};

export default HeroSection;
