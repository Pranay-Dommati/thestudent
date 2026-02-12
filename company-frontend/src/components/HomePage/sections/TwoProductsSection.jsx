import { StaggerContainer, StaggerItem } from '../animations';
import { HiOutlineAcademicCap, HiOutlineCode, HiArrowRight } from 'react-icons/hi';

/**
 * Two Products Section - V3
 * The "Center" of the page. Replaces all other product showcases.
 * 1. EasyLearnova Courses
 * 2. EasyLearnova Code Visualizer
 * Replaced emojis with icons.
 */
const TwoProductsSection = () => {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                        Two Specialized Learning Systems
                    </h2>
                    <p className="text-lg text-slate-600">
                        We don't mix things up. Choose the system built for you.
                    </p>
                </div>

                <StaggerContainer className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">

                    {/* Product 1: Courses */}
                    <StaggerItem>
                        <div className="h-full p-6 sm:p-10 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors shadow-sm flex flex-col items-start group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 sm:mb-8 border border-blue-100 group-hover:scale-110 transition-transform duration-300">
                                <HiOutlineAcademicCap className="w-7 h-7 sm:w-8 sm:h-8" />
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">EasyLearnova Courses</h3>
                            <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4 sm:mb-6">For School Students (6th–12th)</p>

                            {/* MOBILE CONTENT */}
                            <div className="sm:hidden w-full">
                                <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                                    Structured, syllabus-aligned learning — without confusion.
                                </p>
                                <ul className="space-y-3 mb-8 w-full">
                                    {['Board-aligned chapters', 'Clear learning paths'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* DESKTOP CONTENT */}
                            <div className="hidden sm:block w-full flex-grow">
                                <p className="text-slate-600 mb-8 leading-relaxed text-base">
                                    Syllabus-aligned structured courses with clear chapters, progress tracking, and quizzes. Everything you need to master your board exams.
                                </p>
                                <ul className="space-y-3 mb-10 w-full">
                                    {['Syllabus-aligned courses', 'Structured chapters', 'Learning paths per subject', 'Quizzes & revision support'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA Positioned Higher on Mobile */}
                            <a
                                href="https://courses.easylearnova.com"
                                className="w-full py-3 sm:py-4 px-6 rounded-xl bg-slate-50 text-slate-900 font-semibold border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-center flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 z-10 relative"
                            >
                                Go to Courses
                                <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </a>


                        </div>
                    </StaggerItem>

                    {/* Product 2: Code Visualizer */}
                    <StaggerItem>
                        <div className="h-full p-6 sm:p-10 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 transition-colors shadow-sm flex flex-col items-start group">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 sm:mb-8 border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                                <HiOutlineCode className="w-7 h-7 sm:w-8 sm:h-8" />
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Code Visualizer</h3>
                            <p className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-wider mb-4 sm:mb-6">For Engineering & DSA</p>

                            {/* MOBILE CONTENT */}
                            <div className="sm:hidden w-full">
                                <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                                    See how code actually runs — step by step.
                                </p>
                                <ul className="space-y-3 mb-8 w-full">
                                    {['Visual code execution', 'Loops & recursion explained'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* DESKTOP CONTENT */}
                            <div className="hidden sm:block w-full flex-grow">
                                <p className="text-slate-600 mb-8 leading-relaxed text-base">
                                    Stop guessing how code works. See variables change, loops iterate, and recursion unfold step-by-step. Perfect for interviews.
                                </p>
                                <ul className="space-y-3 mb-10 w-full">
                                    {['Visual Python execution', 'Step-by-step dry runs', 'Arrays, loops, recursion visualized', 'Logic building helper'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA Positioned Higher on Mobile */}
                            <a
                                href="https://codevisualizer.easylearnova.com"
                                className="w-full py-3 sm:py-4 px-6 rounded-xl bg-slate-50 text-slate-900 font-semibold border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-center flex items-center justify-center gap-2 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 z-10 relative"
                            >
                                Go to Code Visualizer
                                <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </a>


                        </div>
                    </StaggerItem>

                    {/* Add keyframes for fadeIn if not global */}


                </StaggerContainer>
            </div>
        </section>
    );
};

export default TwoProductsSection;
