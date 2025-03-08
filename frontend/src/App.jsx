import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import Courses from './components/Courses/Courses';
import ChatBotPage from './components/Chatbot/ChatbotPage';
import CourseDetailsPage from './components/CourseDetails/CourseDetailsPage/CourseDetailsPage';
import CourseLearningPage from './components/CourseLearningPage/CourseLearningPage';
import LearningHubPage from './components/LearningHub/LearningHubPage';
import FloatingChatButton from './components/Chatbot/FloatingChatButton';
import AuthForm from './components/Auth/AuthForm';
import TenthStandard from './components/Courses/categories/10th/TenthStandard';
import EleventhStandard from './components/Courses/categories/11th/EleventhStandard';
import TwelfthStandard from './components/Courses/categories/12th/TwelveStandard';
import Undergraduate from './components/Courses/categories/undergraduate/Undergraduate';

function App() {
  return (
    <BrowserRouter>
      {/* Routes for page navigation */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<Courses />}>
          <Route path="10th" element={<TenthStandard />} />
          <Route path="11th" element={<EleventhStandard />} />
          <Route path="12th" element={<TwelfthStandard />} />
          <Route path="undergraduate" element={<Undergraduate />} />
        </Route>
        <Route path="/chat" element={<ChatBotPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
        <Route path="/courses/:courseId/learning" element={<CourseLearningPage />} />
        <Route path="/learning-hub" element={<LearningHubPage />} /> 
        <Route path="/auth" element={<AuthForm />} />
      </Routes>

      {/* Floating chat button - appears on all pages except /chat */}
      <FloatingChatButton />
    </BrowserRouter>
  );
}

export default App;