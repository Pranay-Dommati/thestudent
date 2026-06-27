import { StaggerContainer, StaggerItem } from '../animations';
import { HiOutlineAcademicCap, HiOutlineCode, HiArrowRight, HiOutlineDocumentText, HiCheck } from 'react-icons/hi';

/**
 * Products Section - V4
 * Scrib is the FLAGSHIP product (big featured card).
 * Courses and Code Visualizer are secondary products (smaller cards below).
 */
const ProductsSection = () => {
    const scribFeatures = [
        'Type any topic — Scrib generates the notes',
        'Realistic handwritten PDF output',
        'Ready to print or study from',
        'Pay per page, no subscriptions',
        '50+ free previews to see quality first',
    ];

    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                        Our Products
                    </h2>
                    <p className="text-lg text-slate-600">
                        Three focused tools. Each built for a different kind of learner.
                    </p>
                </div>

                {/* SCRIB – Flagship Product */}
                <div className="max-w-5xl mx-auto mb-8">
                    <div className="relative rounded-2xl bg-white border-2 border-slate-900 shadow-md overflow-hidden">
                        {/* Flagship badge */}
                        <div className="absolute top-6 right-6">
                            <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                                ⭐ Flagship Product
                            </span>
                        </div>

                        <div className="p-8 sm:p-12">
                            {/* Header */}
                            <div className="flex items-start gap-5 mb-8">
                                <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
                                    <HiOutlineDocumentText className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Scrib</h3>
                                    <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider">
                                        AI Handwritten Exam Notes Generator
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="grid sm:grid-cols-2 gap-10">
                                <div>
                                    <p className="text-slate-600 leading-relaxed mb-6 text-base">
                                        Scrib converts any topic you type into a realistic handwritten PDF — exam-style, instantly.
                                        No more spending hours on notes. Just type, generate, and print.
                                    </p>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Pay as you go with credits (₹19–₹319). No subscriptions. Credits never expire.
                                    </p>
                                </div>

                                <ul className="space-y-3">
                                    {scribFeatures.map((feat, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                                                <HiCheck className="w-3 h-3 text-amber-600" />
                                            </div>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA */}
                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <a
                                    href="https://scrib.easylearnova.com"
                                    className="flex-1 sm:flex-none py-3 px-8 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors text-center flex items-center justify-center gap-2"
                                >
                                    Try Scrib Free
                                    <HiArrowRight className="w-4 h-4" />
                                </a>
                                <a
                                    href="https://scrib.easylearnova.com/previews"
                                    className="flex-1 sm:flex-none py-3 px-6 rounded-xl bg-white text-slate-700 font-medium border border-slate-200 hover:border-slate-300 transition-colors text-center"
                                >
                                    Browse free previews
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Products */}
                <StaggerContainer className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">

                    {/* Product: Courses */}
                    <StaggerItem>
                        <div className="h-full p-8 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors shadow-sm flex flex-col items-start group">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 border border-blue-100 group-hover:scale-110 transition-transform duration-300">
                                <HiOutlineAcademicCap className="w-7 h-7" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-1">EasyLearnova Courses</h3>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">For School Students (6th–12th)</p>

                            <p className="text-slate-600 mb-6 leading-relaxed text-sm flex-grow">
                                Syllabus-aligned structured courses with clear chapters, progress tracking, and quizzes. Board exam prep made structured.
                            </p>

                            <ul className="space-y-2 mb-8 w-full">
                                {['Syllabus-aligned chapters', 'Clear learning paths', 'Structured revision support'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-slate-700 text-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="https://courses.easylearnova.com"
                                className="w-full py-3 px-6 rounded-xl bg-slate-50 text-slate-900 font-semibold border border-slate-200 hover:bg-slate-100 transition-all text-center flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                            >
                                Go to Courses
                                <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </a>
                        </div>
                    </StaggerItem>

                    {/* Product: Code Visualizer */}
                    <StaggerItem>
                        <div className="h-full p-8 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 transition-colors shadow-sm flex flex-col items-start group">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                                <HiOutlineCode className="w-7 h-7" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-1">Code Visualizer</h3>
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-4">For Engineering & DSA</p>

                            <p className="text-slate-600 mb-6 leading-relaxed text-sm flex-grow">
                                Stop guessing how code works. See variables change, loops iterate, and recursion unfold step-by-step. Build real intuition.
                            </p>

                            <ul className="space-y-2 mb-8 w-full">
                                {['Visual Python execution', 'Step-by-step dry runs', 'Arrays, loops, recursion visualized'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-slate-700 text-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="https://codevisualizer.easylearnova.com"
                                className="w-full py-3 px-6 rounded-xl bg-slate-50 text-slate-900 font-semibold border border-slate-200 hover:bg-slate-100 transition-all text-center flex items-center justify-center gap-2 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600"
                            >
                                Go to Code Visualizer
                                <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </a>
                        </div>
                    </StaggerItem>

                </StaggerContainer>
            </div>
        </section>
    );
};

export default ProductsSection;
