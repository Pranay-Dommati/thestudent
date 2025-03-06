import './App.css';
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import FeaturedPlaylists from './components/FeaturedPlaylists/FeaturedPlaylists';
import AIGeneratedLearningPath from './components/AIGeneratedLearningPath/AIGeneratedLearningPath';
import TrustSection from './components/TrustSection/TrustSection';
import Testimonials from './components/Testimonials/Testimonials';
import Footer from './components/Footer/Footer';

function App() {
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

export default App;
