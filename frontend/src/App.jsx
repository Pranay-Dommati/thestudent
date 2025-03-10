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
import Undergraduate from './components/Courses/categories/engineering/Engineering';
import ProfileLayout from './components/Profile/ProfilePage';
import CourseDetails from './components/CourseDetails/CourseDetails';
import SchoolCourseDetails from './components/CourseDetails/SchoolCourseDetails';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

const CourseDetailsWrapper = () => {
  const { courseId } = useParams();
  
  const determineCourseType = (id) => {
    return ['10th', '11th', '12th'].some(grade => id.startsWith(grade)) ? 'school' : 'engineering';
  };

  const courseType = determineCourseType(courseId);
  
  return courseType === 'school' ? (
    <SchoolCourseDetails courseId={courseId} />
  ) : (
    <CourseDetails courseId={courseId} />
  );
};

const Layout = ({ children }) => {
  const location = useLocation();
  const isChat = location.pathname === '/chat';

  return (
    <>
      {!isChat && <Navbar />}
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Layout>  {/* Layout component wraps all routes and includes Navbar and Footer */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<Courses />}>
            <Route path="10th" element={<TenthStandard />} />
            <Route path="10th/cbse" element={<TenthStandard />} />
            <Route path="10th/state/:stateId" element={<TenthStandard />} />
            <Route path="11th" element={<EleventhStandard />} />
            <Route path="11th/cbse" element={<EleventhStandard />} />
            <Route path="11th/state/:stateId" element={<EleventhStandard />} />
            <Route path="12th" element={<TwelfthStandard />} />
            <Route path="12th/cbse" element={<TwelfthStandard />} />
            <Route path="12th/state/:stateId" element={<TwelfthStandard />} />
            <Route path="engineering" element={<Undergraduate />} />
            <Route path="engineering/cbse" element={<Undergraduate />} />
            <Route path="engineering/state/:stateId" element={<Undergraduate />} />
          </Route>
          <Route path="/profile" element={<ProfileLayout />} />
          <Route path="/chat" element={<ChatBotPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailsWrapper />} />
          <Route path="/courses/:courseId/learning" element={<CourseLearningPage />} />
          <Route path="/learning-hub" element={<LearningHubPage />} /> 
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/courses/10th/cbse/:subjectId" element={<SchoolCourseDetails />} />
          <Route path="/courses/10th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
          <Route path="/courses/11th/cbse/:subjectId" element={<SchoolCourseDetails />} />
          <Route path="/courses/11th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
          <Route path="/courses/12th/cbse/:subjectId" element={<SchoolCourseDetails />} />
          <Route path="/courses/12th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
          <Route path="/courses/engineering/:courseId" element={<CourseDetails />} />
          <Route path="/courses/engineering/:courseId/learning" element={<CourseLearningPage />} />
          <Route path="/courses/10th/cbse/:subjectId/learning" element={<CourseLearningPage />} />
          <Route path="/courses/10th/state/:stateId/:subjectId/learning" element={<CourseLearningPage />} />
          <Route path="/courses/11th/cbse/:subjectId/learning" element={<CourseLearningPage />} />
          <Route path="/courses/11th/state/:stateId/:subjectId/learning" element={<CourseLearningPage />} />
          <Route path="/courses/12th/cbse/:subjectId/learning" element={<CourseLearningPage />} />
          <Route path="/courses/12th/state/:stateId/:subjectId/learning" element={<CourseLearningPage />} />
        </Routes>
      </Layout>
      <FloatingChatButton />
    </BrowserRouter>
  );
}

export default App;