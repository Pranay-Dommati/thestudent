import { AnimatedSection } from '../animations';
import { HiOutlineAcademicCap, HiOutlineCode, HiArrowRight } from 'react-icons/hi';

/**
 * Final Navigation (CTA) Section - V3
 * "Clean Exit" -> Two large main cards reinforcement.
 * Ensuring memory retention.
 * Replaced emojis with icons.
 */
const CTASection = () => {
    return (
        <AnimatedSection className="py-24 bg-white border-t border-slate-100">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Where do you fit?
                        </h2>
                        <p className="text-slate-500">
                            Select your path. No more searching.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">

                        {/* School Card */}
                        <a
                            href="https://courses.easylearnova.com"
                            className="group relative p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <HiOutlineAcademicCap className="w-7 h-7" />
                                </span>
                                <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-slate-100">
                                    <HiArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">School Courses</h3>
                            <p className="text-slate-600">
                                Go to centralized learning for Class 6–12
                            </p>
                        </a>

                        {/* Engineer Card */}
                        <a
                            href="https://codevisualizer.easylearnova.com"
                            className="group relative p-8 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <HiOutlineCode className="w-7 h-7" />
                                </span>
                                <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-colors border border-slate-100">
                                    <HiArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Code Visualizer</h3>
                            <p className="text-slate-600">
                                Go to visual understanding for Engineering
                            </p>
                        </a>

                    </div>
                </div>
            </div>
        </AnimatedSection>
    );
};

export default CTASection;
