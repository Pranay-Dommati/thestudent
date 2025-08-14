import Hero from "./Hero/Hero";
import FeaturedPlaylists from "./FeaturedPlaylists/FeaturedPlaylists";
import AIGeneratedLearningPath from "./AIGeneratedLearningPath/AIGeneratedLearningPathComponent";
import TrustSection from "./TrustSection/TrustSection";
// import Testimonials from "./Testimonials/Testimonials";
import Footer from "../Footer/Footer";

const HomePage = () => {
    return (
        <>
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