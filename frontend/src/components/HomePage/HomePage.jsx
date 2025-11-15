import Hero from "./Hero/Hero";
import FeaturedPlaylists from "./FeaturedPlaylists/FeaturedPlaylists";
import AIGeneratedLearningPath from "./AIGeneratedLearningPath/AIGeneratedLearningPathComponent";
import TrustSection from "./TrustSection/TrustSection";
// import Testimonials from "./Testimonials/Testimonials";
import Footer from "../Footer/Footer";
import SEO from "../SEO/SEO";

const HomePage = () => {
    return (
        <>
            <SEO
                title="EasyLearnova - AI-Powered Learning Platform | Custom Courses & Board Syllabus"
                description="Transform your learning with EasyLearnova's AI-powered platform. Create custom courses with our Pro Learning feature or access structured CBSE & State Board content for grades 6-12. Master any subject with personalized learning paths, curated videos, interactive quizzes, and comprehensive resources—all in one place."
                keywords="EasyLearnova, AI learning platform, Pro Learning, custom course creation, CBSE courses, state board syllabus, 6th to 12th standard, AI chatbot tutor, personalized learning, structured courses, board exam preparation"
                canonical="https://easylearnova.com/"
            />
            <Hero />
            <FeaturedPlaylists />
            <AIGeneratedLearningPath />
            <TrustSection />
            {/* <Testimonials /> */}
            <Footer />
        </>
    );
}

export default HomePage;