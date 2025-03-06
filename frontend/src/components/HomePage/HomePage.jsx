import Hero from "./Hero/Hero";
import FeaturedPlaylists from "./FeaturedPlaylists/FeaturedPlaylists";
import AIGeneratedLearningPath from "./AIGeneratedLearningPath/AIGeneratedLearningPath";
import TrustSection from "./TrustSection/TrustSection";
import Testimonials from "./Testimonials/Testimonials";

const HomePage = () => {
    return (
        <>
            <Hero />
            <FeaturedPlaylists />
            <AIGeneratedLearningPath />
            <TrustSection />
            <Testimonials />
        </>
    );
}

export default HomePage;