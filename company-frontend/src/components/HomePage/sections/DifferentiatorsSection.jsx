import { AnimatedSection, StaggerContainer, StaggerItem } from '../animations';

/**
 * Differentiators Section - V3
 * Plain language list. Minimal icons.
 * Focus on "Structured, Visual, Separate systems"
 */
const DifferentiatorsSection = () => {
    const differentiators = [
        {
            title: "Structured, not random",
            desc: "Youtube is great for discovery, terrible for mastery. We provide the structure."
        },
        {
            title: "Visual understanding",
            desc: "For engineers, we don't just show code. We visualize its execution state."
        },
        {
            title: "Separate systems",
            desc: "A 10th grader and a CS major need different tools. We built both."
        },
        {
            title: "Long-term clarity",
            desc: "No shortcuts. Just clear, steady progress tracking."
        }
    ];

    return (
        <AnimatedSection className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">
                        What Makes EasyLearnova Different
                    </h2>
                    <div className="h-1 w-20 bg-slate-900 rounded-full" />
                </div>

                <StaggerContainer className="grid sm:grid-cols-2 gap-x-12 gap-y-12 max-w-4xl mx-auto">
                    {differentiators.map((item, index) => (
                        <StaggerItem key={index}>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-bold text-slate-900 mb-3 relative">
                                    <span className="absolute -left-6 top-0 text-slate-300 font-normal">0{index + 1}</span>
                                    {item.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </AnimatedSection>
    );
};

export default DifferentiatorsSection;
