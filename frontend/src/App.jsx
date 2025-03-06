import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import Courses from './components/Courses/Courses';
import ChatBotPage from './components/Chatbot/ChatbotPage';
import CourseDetailsPage from './components/CourseDetails/CourseDetailsPage/CourseDetailsPage';
import CourseLearningPage from './components/CourseLearningPage/CourseLearningPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/chat" element={<ChatBotPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
        <Route path="/courses/:courseId/learning" element={<CourseLearningPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;