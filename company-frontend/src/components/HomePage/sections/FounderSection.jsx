import { AnimatedSection } from '../animations';

/**
 * Founder Section - V4
 * Updated copy per user request.
 * Focus: Learning design vs Student ability.
 */
const FounderSection = () => {
    return (
        <AnimatedSection className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto">

                    {/* Main Headline */}
                    <div className="mb-10 text-center sm:text-left">
                        {/* Mobile: Quote Block Style */}
                        <div className="sm:hidden border-l-4 border-slate-900 pl-6 py-2">
                            <h2 className="text-2xl font-bold text-slate-900 italic leading-tight">
                                “Learning isn’t hard. <br />
                                It just hasn’t been designed clearly enough.”
                            </h2>
                        </div>

                        {/* Desktop: Standard Style */}
                        <div className="hidden sm:block">
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 leading-tight">
                                Learning isn’t hard. <br />
                                <span className="text-slate-500">It just hasn’t been designed clearly enough.</span>
                            </h2>
                        </div>
                    </div>

                    {/* Body Text */}
                    <div className="space-y-6 text-lg text-slate-700 leading-relaxed mb-10 text-left">
                        <p>
                            Most students don’t struggle because they lack ability.
                        </p>
                        <p>
                            They struggle because learning systems are scattered, unstructured, and built around content — not understanding.
                        </p>
                        <p className="font-medium text-slate-900">
                            That’s exactly what we’re building at EasyLearnova.
                        </p>
                    </div>

                    {/* Signature */}
                    <div className="pt-8 border-t border-slate-200">
                        <cite className="not-italic font-bold text-slate-900 block text-lg">
                            Pranay Dommati
                        </cite>
                        <span className="text-slate-500">Founder, EasyLearnova</span>
                    </div>

                </div>
            </div>
        </AnimatedSection>
    );
};

export default FounderSection;
