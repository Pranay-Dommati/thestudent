import { AnimatedSection } from '../animations';
import { HiAcademicCap, HiCode, HiCheck, HiX, HiArrowRight } from 'react-icons/hi';

/**
 * Problems Section - V4 (Redesigned)
 * "Stacked" Layout: School First, Then Engineering.
 * Contrasts "Classic Chaos" vs "EasyLearnova Clarity" side-by-side for each group.
 */
const ProblemsSection = () => {
    return (
        <section className="py-24 bg-white border-b border-slate-100">
            <div className="container mx-auto px-6">

                {/* Main Section Header */}
                <AnimatedSection className="max-w-4xl mx-auto text-center mb-24">
                    <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                        Why Learning Breaks <br className="hidden sm:block" />
                        <span className="text-slate-400">for Most Students</span>
                    </h2>
                    <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                        It’s not you. It’s the system. <br />
                        We replaced scattered content with structured systems.
                    </p>
                </AnimatedSection>


                {/* BLOCK 1: School Students */}
                <AnimatedSection className="mb-32">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <HiAcademicCap className="w-7 h-7" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900">School Students</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        {/* The Problem (Red) */}
                        <div className="p-8 rounded-3xl bg-red-50/50 border border-red-100">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-red-600 uppercase tracking-widest mb-6">
                                <HiX className="w-5 h-5" /> The Broken Way
                            </h4>
                            <ul className="space-y-5">
                                {[
                                    "Random videos, no syllabus tracking",
                                    "Important tops skipped or skimmed",
                                    "Memorizing without understanding",
                                    "Panic studying before exams"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* The Solution (Blue) */}
                        <div className="p-8 rounded-3xl bg-blue-50/50 border border-blue-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full opacity-50 -mr-16 -mt-16" />

                            <h4 className="flex items-center gap-2 text-sm font-bold text-blue-700 uppercase tracking-widest mb-6 relative z-10">
                                <HiCheck className="w-5 h-5" /> The EasyLearnova Way
                            </h4>
                            <ul className="space-y-5 relative z-10">
                                {[
                                    "Strict syllabus-aligned structure",
                                    "Clear learning paths per subject",
                                    "Visual concepts that stick",
                                    "Steady, tracked progress"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-900 font-medium">
                                        <HiCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </AnimatedSection>


                {/* BLOCK 2: Engineering Students */}
                <AnimatedSection>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <HiCode className="w-7 h-7" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900">Engineering / DSA</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        {/* The Problem (Red) */}
                        <div className="p-8 rounded-3xl bg-red-50/50 border border-red-100">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-red-600 uppercase tracking-widest mb-6">
                                <HiX className="w-5 h-5" /> The Broken Way
                            </h4>
                            <ul className="space-y-5">
                                {[
                                    "Code runs, but logic feels invisible",
                                    "Tutorials jump straight to solutions",
                                    "Debugging is guess-work",
                                    "Abstract concepts stay abstract"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* The Solution (Purple) */}
                        <div className="p-8 rounded-3xl bg-purple-50/50 border border-purple-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-bl-full opacity-50 -mr-16 -mt-16" />

                            <h4 className="flex items-center gap-2 text-sm font-bold text-purple-700 uppercase tracking-widest mb-6 relative z-10">
                                <HiCheck className="w-5 h-5" /> The EasyLearnova Way
                            </h4>
                            <ul className="space-y-5 relative z-10">
                                {[
                                    "Step-by-step code execution",
                                    "Variables & memory visualized",
                                    "See logic move, not just output",
                                    "Build intuition, not shortcuts"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-900 font-medium">
                                        <HiCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </AnimatedSection>

            </div>
        </section>
    );
};

export default ProblemsSection;
