import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import FeaturedPlaylists from "./FeaturedPlaylists/FeaturedPlaylists";
import Hero from "./Hero/Hero";
import AIGeneratedLearningPath from "./AIGeneratedLearningPath/AIGeneratedLearningPath";
import TrustSection from "./TrustSection/TrustSection";
import Testimonials from "./Testimonials/Testimonials";
const HomePage = () => {
    return (
        <>
        <Navbar />
        <Hero />
        <FeaturedPlaylists />
        <AIGeneratedLearningPath />
        <TrustSection />
        <Testimonials />
        <Footer />
        </>
    );
}
export default HomePage;