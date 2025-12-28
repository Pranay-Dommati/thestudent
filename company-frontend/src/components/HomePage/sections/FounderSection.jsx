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

                    {/* MOBILE: Final Mobile Structure (Quote -> Direction -> Signature) */}
                    <div className="sm:hidden text-left">
                        {/* 1. Quote Block */}
                        <div className="border-l-4 border-slate-900 pl-6 py-2 mb-6 max-w-sm">
                            <h2 className="text-xl font-bold text-slate-900 italic leading-relaxed">
                                “Learning isn’t hard. <br />
                                It just hasn’t been designed clearly enough.”
                            </h2>
                        </div>

                        {/* 2. Direction Block */}
                        <div className="mb-6">
                            <p className="text-base text-slate-500 leading-normal">
                                We’re building learning systems <br />
                                that make understanding the default.
                            </p>
                        </div>

                        {/* 3. Signature Block */}
                        <div className="mt-2">
                            <cite className="not-italic text-sm font-bold text-slate-500 block">
                                — Pranay Dommati
                            </cite>
                            <span className="text-xs text-slate-500">Founder, EasyLearnova</span>
                        </div>
                    </div>

                    {/* DESKTOP: Standard Style */}
                    <div className="hidden sm:block">
                        {/* Main Headline */}
                        <div className="mb-10 text-left">
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 leading-tight">
                                Learning isn’t hard. <br />
                                <span className="text-slate-500">It just hasn’t been designed clearly enough.</span>
                            </h2>
                        </div>

                        {/* Body Text - Updated to concise version */}
                        <div className="text-xl text-slate-600 leading-normal mb-10 text-left bg-white/50 backdrop-blur-sm inline-block rounded-xl">
                            <p>
                                We’re building learning systems <br />
                                that make understanding the default.
                            </p>
                        </div>

                        {/* Signature */}
                        <div className="pt-8 border-t border-slate-200">
                            <cite className="not-italic font-bold text-slate-900 block text-lg">
                                — Pranay Dommati
                            </cite>
                            <span className="text-slate-500">Founder, EasyLearnova</span>
                        </div>
                    </div>

                </div>
            </div>
        </AnimatedSection>
    );
};

export default FounderSection;
