import { AnimatedSection } from '../animations';

/**
 * Founder Section - V5
 * Updated to reflect Scrib as the flagship product.
 * Same philosophy — learning design problem — now with Scrib context.
 */
const FounderSection = () => {
    return (
        <AnimatedSection className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto">

                    {/* MOBILE: Final Mobile Structure */}
                    <div className="sm:hidden text-left">
                        <div className="border-l-4 border-slate-900 pl-6 py-2 mb-6 max-w-sm">
                            <h2 className="text-xl font-bold text-slate-900 italic leading-relaxed">
                                "Students don't need more content. <br />
                                They need the right tools to process it."
                            </h2>
                        </div>

                        <div className="mb-6">
                            <p className="text-base text-slate-500 leading-normal">
                                That's why we built Scrib — <br />
                                so studying takes minutes, not hours.
                            </p>
                        </div>
                    </div>

                    {/* DESKTOP: Standard Style */}
                    <div className="hidden sm:block">
                        <div className="mb-10 text-left">
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 leading-tight">
                                Students don't need more content. <br />
                                <span className="text-slate-500">They need the right tools to process it.</span>
                            </h2>
                        </div>

                        <div className="text-xl text-slate-600 leading-normal mb-10 text-left bg-white/50 backdrop-blur-sm inline-block rounded-xl">
                            <p>
                                That's the gap we're filling at EasyLearnova — <br />
                                with Scrib for notes, Courses for school, and Code Visualizer for engineers.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </AnimatedSection>
    );
};

export default FounderSection;
