import './App.css';
import { BrowserRouter, Routes, Route, useParams, useLocation } from 'react-router-dom';
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
import TwelfthStandard from './components/Courses/categories/12th/TwelfthStandard';
import Undergraduate from './components/Courses/categories/undergraduate/Engineering';
import ProfileLayout from './components/Profile/ProfilePage';
import CourseDetails from './components/CourseDetails/CourseDetails';
import SchoolCourseDetails from './components/CourseDetails/SchoolCourseDetails';

const CourseDetailsWrapper = () => {
  const { courseId } = useParams();
  
  const determineCourseType = (id) => {
    // Check if courseId starts with 10th, 11th, or 12th
    return ['10th', '11th', '12th'].some(grade => id.startsWith(grade)) ? 'school' : 'engineering';
  };

  const courseType = determineCourseType(courseId);
  
  return courseType === 'school' ? (
    <SchoolCourseDetails courseId={courseId} />
  ) : (
    <CourseDetails courseId={courseId} />
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<Courses />}>
          <Route path="10th" element={<TenthStandard />} />
          <Route path="11th" element={<EleventhStandard />} />
          <Route path="12th" element={<TwelfthStandard />} />
          <Route path="engineering" element={<Undergraduate />} />
        </Route>
        <Route path="/profile" element={<ProfileLayout />} />
        <Route path="/chat" element={<ChatBotPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailsWrapper />} />
        <Route path="/courses/:courseId/learning" element={<CourseLearningPage />} />
        <Route path="/learning-hub" element={<LearningHubPage />} /> 
        <Route path="/auth" element={<AuthForm />} />
      </Routes>

      <FloatingChatButton />
    </BrowserRouter>
  );
}

export default App;