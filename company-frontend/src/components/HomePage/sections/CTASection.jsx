import { AnimatedSection } from '../animations';
import { HiOutlineDocumentText, HiOutlineAcademicCap, HiOutlineCode, HiArrowRight } from 'react-icons/hi';

/**
 * Final Navigation (CTA) Section - V4
 * Scrib-first CTA with Courses & Code Visualizer below.
 */
const CTASection = () => {
    return (
        <AnimatedSection className="py-24 bg-white border-t border-slate-100">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Get started today
                        </h2>
                        <p className="text-slate-500">
                            Try Scrib free — no account needed to browse previews.
                        </p>
                    </div>

                    {/* Primary Scrib CTA */}
                    <a
                        href="https://scrib.easylearnova.com"
                        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-300 mb-6 active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-4">
                            <span className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                <HiOutlineDocumentText className="w-7 h-7 text-amber-300" />
                            </span>
                            <div>
                                <h3 className="text-2xl font-bold mb-1">Try Scrib</h3>
                                <p className="text-slate-300 text-sm">Generate AI handwritten exam notes — starting at ₹19</p>
                            </div>
                        </div>
                        <span className="flex items-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors text-sm whitespace-nowrap">
                            Start free
                            <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                    </a>

                    {/* Secondary product cards */}
                    <div className="grid md:grid-cols-2 gap-4">

                        {/* School Card */}
                        <a
                            href="https://courses.easylearnova.com"
                            className="group relative p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="w-11 h-11 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <HiOutlineAcademicCap className="w-6 h-6" />
                                </span>
                                <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-slate-100">
                                    <HiArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">School Courses</h3>
                            <p className="text-slate-500 text-sm">
                                Syllabus-aligned learning for Class 6–12
                            </p>
                        </a>

                        {/* Engineer Card */}
                        <a
                            href="https://codevisualizer.easylearnova.com"
                            className="group relative p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="w-11 h-11 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <HiOutlineCode className="w-6 h-6" />
                                </span>
                                <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-colors border border-slate-100">
                                    <HiArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Code Visualizer</h3>
                            <p className="text-slate-500 text-sm">
                                Visual code understanding for Engineering & DSA
                            </p>
                        </a>

                    </div>
                </div>
            </div>
        </AnimatedSection>
    );
};

export default CTASection;
