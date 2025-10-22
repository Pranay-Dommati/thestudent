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
                title="EasyLearnova - AI-Powered Student Learning Hub"
                description="EasyLearnova — AI-powered student learning hub. Discover free, structured course playlists for school and college and learn faster with personalized paths."
                keywords="EasyLearnova, AI learning, free courses, student learning hub, curated playlists, online courses, 6th to 12th standard"
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