import { AnimatedSection, StaggerContainer, StaggerItem } from '../animations';

/**
 * Differentiators Section - V4
 * Updated to reflect Scrib as the main product.
 * Focus on "instant notes, real handwriting, affordable, no subscription"
 */
const DifferentiatorsSection = () => {
    const differentiators = [
        {
            title: "Actually handwritten",
            desc: "Not typed. Not a font. Scrib generates notes that genuinely look handwritten — something you'd actually study from."
        },
        {
            title: "Any topic, instantly",
            desc: "Physics, history, biology, engineering — type any subject and get structured exam notes in seconds."
        },
        {
            title: "Pay per page, not per month",
            desc: "Buy credits as you need them. Starts at ₹19. No subscriptions, no auto-renewals, and credits never expire."
        },
        {
            title: "See before you buy",
            desc: "Browse 50+ free handwritten note previews before spending a single rupee. No account required."
        }
    ];

    return (
        <AnimatedSection className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">
                        Why Scrib is different
                    </h2>
                    <div className="h-1 w-20 bg-slate-900 rounded-full" />
                </div>

                <StaggerContainer className="grid sm:grid-cols-2 gap-x-12 gap-y-12 max-w-4xl mx-auto">
                    {differentiators.map((item, index) => (
                        <StaggerItem key={index}>
                            <div className="flex flex-col relative pl-6 border-l-2 border-slate-100 sm:border-0 sm:pl-0">
                                {/* Mobile Timeline Dot */}
                                <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-slate-900 sm:hidden" />

                                <h3 className="text-xl font-bold text-slate-900 mb-3 relative">
                                    <span className="hidden sm:block absolute -left-6 top-0 text-slate-300 font-normal">0{index + 1}</span>
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
