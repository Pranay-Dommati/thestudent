import { AnimatedSection } from '../animations';
import { HiOutlineDocumentText, HiCheck, HiX } from 'react-icons/hi';

/**
 * Problems Section - V7
 * Scrib-first: "Writing notes by hand is painful. Scrib fixes that."
 * Simple two-column before/after layout.
 */
const ProblemsSection = () => {
    const withoutScrib = [
        'Hours writing notes you already understand',
        'Messy handwriting that\'s hard to study from',
        'Running out of time before exams',
        'Rewriting the same topics over and over',
    ];

    const withScrib = [
        'Type a topic → get a ready-to-print handwritten PDF',
        'Clean, exam-style handwriting every time',
        'Generate notes for any subject in seconds',
        'Re-download any past note for free',
    ];

    return (
        <section className="py-24 bg-white border-b border-slate-100">
            <div className="container mx-auto px-5 sm:px-6">

                {/* Main Header */}
                <AnimatedSection className="max-w-4xl mx-auto text-left sm:text-center mb-16 sm:mb-20">
                    <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                        Writing exam notes by hand{' '}
                        <span className="text-slate-400">takes too long.</span>
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-2xl sm:mx-auto">
                        Students spend hours on notes they already understand.
                        Scrib gives you that time back.
                    </p>
                </AnimatedSection>

                {/* Before / After Card */}
                <AnimatedSection>
                    <div className="max-w-5xl mx-auto bg-slate-50 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 border border-slate-100 shadow-sm">

                        {/* Card header */}
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/60">
                            <div className="w-12 h-12 rounded-2xl bg-white text-amber-500 shadow-sm flex items-center justify-center flex-shrink-0">
                                <HiOutlineDocumentText className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Exam Note Preparation</h3>
                                <p className="text-slate-500 text-sm">The old way vs. Scrib</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 lg:gap-20 relative text-left">
                            {/* Central Divider (Desktop) */}
                            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 -ml-px" />

                            {/* Left: Without Scrib */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                    Without Scrib
                                </h4>
                                <ul className="space-y-5">
                                    {withoutScrib.map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 text-slate-500">
                                            <HiX className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                                            <span className="leading-relaxed font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Right: With Scrib */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    With Scrib
                                </h4>
                                <ul className="space-y-5">
                                    {withScrib.map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 text-slate-900">
                                            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                                                <HiCheck className="w-3.5 h-3.5 text-amber-600" />
                                            </div>
                                            <span className="leading-relaxed font-semibold">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

            </div>
        </section>
    );
};

export default ProblemsSection;
