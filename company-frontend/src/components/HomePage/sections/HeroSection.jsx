import { HiAcademicCap, HiCode, HiArrowRight } from 'react-icons/hi';
import { AnimatedSection } from '../animations';

/**
 * Hero Section - V4
 * Scrib-first positioning. Scrib is the flagship product.
 * Mobile: fully left-aligned. Desktop: centered.
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

            {/* SEO: Screen-reader-only H1 for crawlers */}
            <h1 className="sr-only">
                EasyLearnova – AI-powered learning tools including Scrib handwritten notes generator, school courses, and code visualizer
            </h1>

            <div className="container mx-auto px-6 py-20 relative z-10">

                {/* ── MOBILE layout (left-aligned throughout) ── */}
                <div className="sm:hidden text-left max-w-lg">
                    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-slate-600">New from EasyLearnova</span>
                    </div>

                    <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
                        AI Handwritten<br />Exam Notes,<br />Instantly.
                    </h2>
                    <p className="text-base text-slate-500 mb-2 leading-relaxed">
                        Type any topic. Get a ready-to-print handwritten PDF in seconds.
                    </p>
                    <p className="text-sm text-slate-400 font-medium mb-8">
                        Introducing <span className="text-slate-700 font-semibold">Scrib</span> — our flagship AI product.
                    </p>

                    <a
                        href="https://scrib.easylearnova.com"
                        className="w-full py-4 px-8 bg-slate-900 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-transform mb-10"
                    >
                        Try Scrib Free
                        <HiArrowRight className="w-5 h-5" />
                    </a>

                    {/* Secondary products — left-aligned */}
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Also from EasyLearnova</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <a
                            href="https://courses.easylearnova.com"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 transition-colors text-xs font-medium"
                        >
                            <HiAcademicCap className="w-4 h-4 text-blue-500" />
                            School Courses
                        </a>
                        <a
                            href="https://codevisualizer.easylearnova.com"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:border-purple-300 hover:text-purple-600 transition-colors text-xs font-medium"
                        >
                            <HiCode className="w-4 h-4 text-purple-500" />
                            Code Visualizer
                        </a>
                    </div>
                </div>

                {/* ── DESKTOP layout (centered) ── */}
                <div className="hidden sm:block max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-slate-600">New from EasyLearnova</span>
                    </div>

                    <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                        <span className="block">AI Handwritten Exam Notes,</span>
                        <span className="block text-slate-500">Generated in Seconds.</span>
                    </h2>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-4 leading-relaxed">
                        Type any topic. Get a beautifully handwritten PDF — exam-ready, instantly.
                    </p>
                    <p className="text-base text-slate-400 font-medium mb-10">
                        Introducing <span className="text-slate-700 font-semibold">Scrib</span> — our flagship AI product by EasyLearnova.
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-14">
                        <a
                            href="https://scrib.easylearnova.com"
                            className="px-8 py-4 bg-slate-900 text-white font-semibold rounded-lg hover:scale-[1.02] transition-transform duration-200 flex items-center gap-3 shadow-lg"
                        >
                            Try Scrib Free
                            <HiArrowRight className="w-5 h-5" />
                        </a>
                        <a
                            href="https://scrib.easylearnova.com/previews"
                            className="px-8 py-4 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:border-slate-300 hover:scale-[1.02] transition-all duration-200 shadow-sm flex items-center gap-2"
                        >
                            Browse free previews
                        </a>
                    </div>

                    {/* Secondary products — centered */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <span className="font-medium text-slate-400 text-sm">Also from EasyLearnova:</span>
                        <a
                            href="https://courses.easylearnova.com"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 transition-colors text-xs font-medium"
                        >
                            <HiAcademicCap className="w-4 h-4 text-blue-500" />
                            School Courses
                        </a>
                        <a
                            href="https://codevisualizer.easylearnova.com"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:border-purple-300 hover:text-purple-600 transition-colors text-xs font-medium"
                        >
                            <HiCode className="w-4 h-4 text-purple-500" />
                            Code Visualizer
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
