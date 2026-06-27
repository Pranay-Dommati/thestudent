import { AnimatedSection } from '../animations';

/**
 * How It Works Section - V4 (replaces LearningPathsSection)
 * Simple 3-step "How Scrib works" flow.
 */
const LearningPathsSection = () => {
    const steps = [
        {
            num: '01',
            title: 'Type your topic',
            desc: 'Enter any exam topic — from Photosynthesis to OSI Model.'
        },
        {
            num: '02',
            title: 'AI generates the notes',
            desc: 'Scrib converts it into a structured handwritten-style PDF.'
        },
        {
            num: '03',
            title: 'Download & study',
            desc: 'Print it or study from screen. Re-download anytime, free.'
        }
    ];

    return (
        <AnimatedSection className="py-20 bg-white border-y border-slate-100">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-10">
                        How Scrib works
                    </p>

                    <div className="grid sm:grid-cols-3 gap-8">
                        {steps.map((step, i) => (
                            <div key={i} className="text-center sm:text-left">
                                <span className="text-4xl font-bold text-slate-100">{step.num}</span>
                                <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">{step.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AnimatedSection>
    );
};

export default LearningPathsSection;
