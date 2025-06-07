import './App.css';
import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
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
import ProfileLayout from './components/Profile/ProfilePageNew';
import CourseDetails from './components/CourseDetails/CourseDetails';
import SchoolCourseDetails from './components/CourseDetails/SchoolCourseDetails';
import Navbar from './components/Navbar/Navbar';
import AdminDashboard from './components/Admin/Dashboard/AdminDashboard';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import HelpCenter from './components/HelpCenter/HelpCenter';
import StandaloneQuizPage from './components/CourseLearningPage/templ/StandaloneQuizPage';
import NotFound from './components/NotFound/NotFound';
import AdminForgotPassword from './components/Admin/AdminForgotPassword';
import MentoringHome from './components/Mentoring/HomePage/MentoringHome';
import IndustryExperts from './components/Mentoring/IndustryExperts/IndustryExperts';
import AlumniMentorship from './components/Mentoring/AlumniMentorship/AlumniMentorship';
import CollegeSeniors from './components/Mentoring/CollegeSeniors/CollegeSeniors';
import MentoringNavbar from './components/Mentoring/MentoringNavbar';
import TermsAndConditions from './components/Legal/TermsAndConditions';
import './utils/axios';

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

const Layout = ({ children, excludePaths = [] }) => {
  const location = useLocation();

  // Check if the current route is related to mentoring
  const isMentoring = location.pathname.startsWith('/mentoring');

  // Check if the current route is in the excludePaths array
  const isExcluded = excludePaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      {/* Render MentoringNavbar for mentoring pages, otherwise render Navbar */}
      {!isExcluded && (isMentoring ? <MentoringNavbar /> : <Navbar />)}
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
};

// Add a protected route component
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/auth?mode=login" />;
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#22c55e',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }} 
      />      <BrowserRouter>
        <Layout excludePaths={['/chat', '/profile']}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Admin Routes */}
            <Route path="/admin-p/*" element={<AdminDashboard />} />
            <Route path="/admin-p/forgot-password" element={<AdminForgotPassword />} />
            
            {/* Course Routes */}
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
            </Route>            {/* Other Routes */}
            <Route path="/profile" element={<ProfileLayout />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/chat" element={<ChatBotPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailsWrapper />} />
            <Route path="/courses/:courseId/learning" element={<CourseLearningPage />} />
            <Route path="/learning-hub" element={
              <ProtectedRoute>
                <LearningHubPage />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<AuthForm />} />

            {/* Course Detail Routes */}
            <Route path="/courses/10th/cbse/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/10th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/11th/cbse/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/11th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/12th/cbse/:subjectId" element={<SchoolCourseDetails />} />            <Route path="/courses/12th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/engineering/:courseId" element={<CourseDetails />} />
            
            {/* Learning Routes */}
            {/* Engineering Course Routes */}
            <Route path="/courses/engineering/:courseId/learning" element={<CourseLearningPage />} />
            <Route path="/courses/engineering/:courseId/learning/quiz" element={<StandaloneQuizPage />} />
            
            {/* 10th Class Routes */}
            <Route path="/courses/10th/cbse/:subjectId/learning" element={<CourseLearningPage />} />
            <Route path="/courses/10th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/10th/state/:stateId/:subjectId/learning" element={<CourseLearningPage />} />
            <Route path="/courses/10th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            
            {/* 11th Class Routes */}
            <Route path="/courses/11th/cbse/:subjectId/learning" element={<CourseLearningPage />} />
            <Route path="/courses/11th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/11th/state/:stateId/:subjectId/learning" element={<CourseLearningPage />} />
            <Route path="/courses/11th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
              {/* 12th Class Routes */}
            <Route path="/courses/12th/cbse/:subjectId/learning" element={<CourseLearningPage />} />
            <Route path="/courses/12th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/12th/state/:stateId/:subjectId/learning" element={<CourseLearningPage />} />
            <Route path="/courses/12th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
              {/* AI Learning Plans Route */}
            <Route path="/learning/:learningPlanId" element={<CourseLearningPage />} />

            {/* Mentoring Routes */}
            {/* <Route path="/mentoring" element={<MentoringHome />} />
            <Route path="/mentoring/college-seniors" element={<CollegeSeniors />} />
            <Route path="/mentoring/industry-experts" element={<IndustryExperts />} />
            <Route path="/mentoring/alumni-mentorship" element={<AlumniMentorship />} /> */}
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <FloatingChatButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;