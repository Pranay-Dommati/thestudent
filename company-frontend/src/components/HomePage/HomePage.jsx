import {
    HeroSection,
    ProblemsSection,
    TwoProductsSection,
    FounderSection,
    CTASection
} from './sections';
import LearningPathsSection from './sections/LearningPathsSection';
import DifferentiatorsSection from './sections/DifferentiatorsSection';

import Footer from '../Footer/Footer';
import SEO from '../SEO/SEO';

/**
 * HomePage - V4
 * "Scrib-first" — Scrib is the flagship product.
 * 
 * Order:
 * 1. Hero (Scrib-first CTA + secondary product pills)
 * 2. Problems (Scrib problem/solution)
 * 3. How It Works (3-step Scrib flow)
 * 4. Products (Scrib flagship card + Courses + Code Visualizer)
 * 5. Differentiators (Why Scrib is different)
 * 6. Founder's Truth (Updated philosophy)
 * 7. Final Navigation (Scrib-first CTA)
 * 8. Footer (Static)
 */
const HomePage = () => {
    return (
        <>
            <SEO
                title="EasyLearnova – AI Handwritten Exam Notes, School Courses & Code Visualizer"
                description="EasyLearnova builds focused learning tools. Scrib generates AI handwritten exam notes PDFs instantly. Also: syllabus-aligned school courses and visual code understanding for engineers."
                keywords="Scrib, EasyLearnova, AI handwritten notes, exam notes PDF, handwritten notes generator, school courses, code visualizer, study tools"
                canonical="https://easylearnova.com/"
            />

            <HeroSection />

            <ProblemsSection />

            <LearningPathsSection />

            <TwoProductsSection />

            <DifferentiatorsSection />

            <FounderSection />

            <CTASection />

            <Footer />
        </>
    );
};

export default HomePage;