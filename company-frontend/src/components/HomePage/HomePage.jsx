import {
    HeroSection,
    ProblemsSection,
    TwoProductsSection,
    // DifferentiatorsSection, // Re-exported but checking if needed in import list if separate file used? 
    // Wait, I need to make sure I import the new LearningPathsSection.
    FounderSection,
    CTASection
} from './sections';
// Need to add LearningPathsSection and DifferentiatorsSection to sections/index.js first
import LearningPathsSection from './sections/LearningPathsSection';
import DifferentiatorsSection from './sections/DifferentiatorsSection';

import Footer from '../Footer/Footer';
import SEO from '../SEO/SEO';

/**
 * HomePage - V3
 * "Learning Systems Company"
 * 
 * Order:
 * 1. Hero (No Animation)
 * 2. Problem Split (Fade+Slide)
 * 3. Two Core Products (Staggered)
 * 4. Learning Paths Context (Fade)
 * 5. Differentiators (Fade list)
 * 6. Founder's Truth (Fade)
 * 7. Final Navigation (Fade+Slide)
 * 8. Footer (Static)
 */
const HomePage = () => {
    return (
        <>
            <SEO
                title="EasyLearnova - Focused Learning Systems for School & Engineering"
                description="EasyLearnova builds focused learning systems. Syllabus-aligned courses for school students and visual mental models for engineering students."
                keywords="EasyLearnova, school courses, engineering learning, code visualization, syllabus aligned, visual learning"
                canonical="https://easylearnova.com/"
            />

            <HeroSection />

            <ProblemsSection />

            <TwoProductsSection />

            <LearningPathsSection />

            <DifferentiatorsSection />

            <FounderSection />

            <CTASection />

            <Footer />
        </>
    );
};

export default HomePage;