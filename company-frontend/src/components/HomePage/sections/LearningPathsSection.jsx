import { AnimatedSection } from '../animations';

/**
 * Learning Paths Section - V3
 * Supporting context only. "Inside EasyLearnova Courses..."
 * No buttons. Just text explanation.
 */
const LearningPathsSection = () => {
    return (
        <AnimatedSection className="py-20 bg-white border-y border-slate-100">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center sm:text-center">
                    {/* Mobile: Insight Box */}
                    <div className="sm:hidden bg-slate-50 p-6 rounded-xl border border-slate-100 text-left">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Structured Learning Paths</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            We organize what to study, when to study it, and how to revise — so students focus on learning, not searching.
                        </p>
                    </div>

                    {/* Desktop: Standard Paragraph */}
                    <div className="hidden sm:block">
                        <h3 className="text-xl font-semibold text-slate-900 mb-3">
                            Structured Learning Paths
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                            Inside EasyLearnova Courses, students can follow predefined learning paths or generate guided learning paths for revision.
                            We organize the chaos so you can focus on learning.
                        </p>
                    </div>
                </div>
            </div>
        </AnimatedSection>
    );
};

export default LearningPathsSection;
