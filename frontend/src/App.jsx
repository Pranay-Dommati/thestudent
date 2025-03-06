import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import HomePage from './components/HomePage/HomePage';
import Courses from './components/Courses/Courses';
import CourseDetailsPage from './components/Courses/CourseDetailsPage/CourseDetailsPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;