import './App.css';
import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import ModalTest from './components/Debug/ModalTest'; // TEMP: Modal debug test
import Courses from './components/Courses/Courses';
import CoursesWrapper from './components/Courses/CoursesWrapper';
import ChatbotWrapper from './components/Chatbot/ChatbotWrapper';
import ProLearningPage from './components/ProLearning'; // Updated to use index.js
import SharedProLearningPage from './components/ProLearning/public/SharedProLearningPage';
import CourseDetailsPage from './components/CourseDetails/CourseDetailsPage/CourseDetailsPage';
// Lazy load heavy learning and certificate pages
const ResponsiveCourseLearningPage = React.lazy(() => import('./components/CourseLearningPage/ResponsiveCourseLearningPage'));
import LearningHubWrapper from './components/LearningHub/LearningHubWrapper';

import AuthForm from './components/Auth/AuthForm';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import SixthStandard from './components/Courses/categories/6th/SixthStandard';
import SeventhStandard from './components/Courses/categories/7th/SeventhStandard';
import EighthStandard from './components/Courses/categories/8th/EighthStandard';
import NinthStandard from './components/Courses/categories/9th/NinthStandard';
import TenthStandard from './components/Courses/categories/10th/TenthStandard';
import EleventhStandard from './components/Courses/categories/11th/EleventhStandard';
import TwelfthStandard from './components/Courses/categories/12th/TwelfthStandard';
import Undergraduate from './components/Courses/categories/engineering/ResponsiveEngineeringCourses';
import ProfileLayout from './components/Profile/ProfilePageNew';
const CourseDetails = React.lazy(() => import('./components/CourseDetails/CourseDetails'));
const SchoolCourseDetails = React.lazy(() => import('./components/CourseDetails/SchoolCourseDetails'));
import Navbar from './components/Navbar/Navbar';
import MobileBottomNavigation from './components/Navigation/MobileBottomNavigation';
import AdminDashboard from './components/Admin/Dashboard/AdminDashboard';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import StandaloneQuizPage from './components/CourseLearningPage/templ/StandaloneQuizPage';
import NotFound from './components/NotFound/NotFound';
import AdminForgotPassword from './components/Admin/AdminForgotPassword';
import AdminResetPassword from './components/Admin/AdminResetPassword';
import TermsAndConditions from './components/Legal/TermsAndConditions';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import FeedbackPage from './components/Feedback/FeedbackPage';  // Add feedback import
import './utils/axios';
import ScrollManager from './components/Common/ScrollManager.jsx';
import OnlineStatusToaster from './components/Common/OnlineStatusToaster.jsx';
import OfflineRouterHandler from './components/Common/OfflineRouterHandler.jsx';
import OfflinePage from './components/Common/OfflinePage.jsx';
const CertificatePreview = React.lazy(() => import('./components/Certificates/CertificatePreview'));
import OnboardingModal from './components/Onboarding/OnboardingModal';

const CourseDetailsWrapper = () => {
  const { courseId } = useParams();
  
  const determineCourseType = (id) => {
    return ['6th', '7th', '8th', '9th', '10th', '11th', '12th'].some(grade => id.startsWith(grade)) ? 'school' : 'engineering';
  };

  const courseType = determineCourseType(courseId);
  
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      {courseType === 'school' ? (
        <SchoolCourseDetails courseId={courseId} />
      ) : (
        <CourseDetails courseId={courseId} />
      )}
    </Suspense>
  );
};

const Layout = ({ children, excludePaths = [] }) => {
  const location = useLocation();

  // Mentoring routes have been removed; always use the main Navbar

  // Special cases: pages that should not show global navbars
  const isCertificatePage = /^\/courses\/[^/]+\/certificate(\/|$)?/.test(location.pathname);
  const isLearningPage = /^\/courses\/.+\/learning(\/|$)?/.test(location.pathname);

  // Check if the current route is in the excludePaths array or should be excluded
  const isExcluded = excludePaths.some(path => location.pathname.startsWith(path)) || 
                     location.pathname.startsWith('/profile') ||
                     isCertificatePage ||
                     isLearningPage; // Exclude profile, certificate and learning pages for focused layout

  // Paths where we don't want mobile navigation (like auth, admin, chat, etc.)
  const noMobileNavPaths = ['/auth', '/admin-p', '/not-found', '/chat', '/pro-learning'];
  const shouldShowMobileNav = !noMobileNavPaths.some(path => location.pathname.startsWith(path)) && !isCertificatePage && !isLearningPage;

  // Determine the navbar style based on the current route
  const getNavbarStyle = () => {
    // Light navbar for pages without hero sections or with light backgrounds
    if (location.pathname.startsWith('/feedback') ||
        location.pathname.startsWith('/terms') ||
        location.pathname.startsWith('/privacy') ||
        location.pathname.startsWith('/profile')) {
      return 'light';
    }
    
    // Transparent navbar for pages with hero sections (Home, Courses, Learning Hub)
    if (location.pathname === '/' || 
        location.pathname.startsWith('/courses') ||
        location.pathname.startsWith('/learning-hub') ||
        location.pathname.startsWith('/pro-learning')) {
      return 'transparent';
    }
    
    // Default to transparent for other pages
    return 'transparent';
  };

  return (
    <>
  {/* Desktop Navigation */}
  {!isExcluded && <Navbar initialStyle={getNavbarStyle()} />}
      
      {/* Mobile Navigation */}
      {shouldShowMobileNav && (
        <>
          <MobileBottomNavigation />
        </>
      )}
      
      <div className={`min-h-screen ${shouldShowMobileNav ? 'pb-0 md:pb-0' : ''}`}>
        {children}
      </div>
    </> 
  );
};

// Add a protected route component
const ProtectedRoute = ({ children }) => {
  const { validateAuth } = useAuth();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  // Allow public access for shared Pro Learning views (no auth required)
  const isPublicProLearningView = (() => {
    try {
      const path = location.pathname || '';
      
      // Always allow the /pro-learning/share/ route (it redirects internally)
      if (path.startsWith('/pro-learning/share/')) {
        return true;
      }
      
      // Check if viewing a UUID-based Pro Learning course loaded from a share link
      const match = path.match(/^\/pro-learning\/([0-9a-fA-F-]{36})(?:\/?|$)/);
      if (!match) return false;
      const courseId = match[1];
      
      // UUID sanity check (8-4-4-4-12)
      const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
      if (!uuidLike) return false;
      
      // Check localStorage for shared-link marker
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`course_content_${courseId}`) : null;
      if (!raw) return false;
      
      const parsed = JSON.parse(raw);
      return parsed?.metadata?.source === 'shared-link';
    } catch (e) {
      return false;
    }
  })();

  useEffect(() => {
    // Bypass auth validation entirely for public Pro Learning views
    if (isPublicProLearningView) {
      setIsValid(true);
      setIsValidating(false);
      return;
    }

    const validate = async () => {
      const valid = await validateAuth();
      setIsValid(valid);
      setIsValidating(false);
    };
    validate();
  }, [validateAuth, isPublicProLearningView, location.pathname, location.search, location.hash]);

  if (isValidating) {
    // Show a loading spinner while validating
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isValid) {
    // NEVER redirect Pro Learning routes to login - they should be publicly accessible
    // or handle their own auth requirements internally
    if (location.pathname.startsWith('/pro-learning/')) {
      return children;
    }
    
    // Redirect with return URL (preserve query and hash)
    const currentPath = `${location.pathname}${location.search || ''}${location.hash || ''}`;
    return <Navigate to={`/auth?mode=login&returnTo=${encodeURIComponent(currentPath)}`} replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: Infinity,
            style: {
              background: 'transparent',
              color: 'inherit',
              padding: '0',
              margin: '0',
              borderRadius: '0',
              boxShadow: 'none',
              maxWidth: 'none',
              border: 'none',
              width: 'auto',
              minWidth: 'auto',
            },
            success: {
              duration: Infinity,
              style: {
                background: 'transparent',
                color: 'inherit',
                padding: '0',
                margin: '0',
                borderRadius: '0',
                boxShadow: 'none',
                border: 'none',
                width: 'auto',
                minWidth: 'auto',
              },
            },
            error: {
              duration: Infinity,
              style: {
                background: 'transparent',
                color: 'inherit',
                padding: '0',
                margin: '0',
                borderRadius: '0',
                boxShadow: 'none',
                border: 'none',
                width: 'auto',
                minWidth: 'auto',
              },
            },
          }}
          containerStyle={{
            top: '20px',
            right: '20px',
          }}
          containerClassName="toast-container"
        />
        <BrowserRouter>
          <ScrollManager />
          {/* Global online/offline toast notifications */}
          <OnlineStatusToaster />
          {/* Auto-route to /offline when disconnected and back when restored */}
          <OfflineRouterHandler />
          {/* Global Onboarding Modal - shows for new users on first login */}
          <OnboardingModal />
          
        <Layout excludePaths={['/admin-p', '/chat', '/offline', '/pro-learning']}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
          <Routes>
            {/* TEMP DEBUG: Replace homepage with modal test */}
            <Route path="/" element={<ModalTest />} />
            <Route path="/home-original" element={<HomePage />} />
            {/* Offline fallback page */}
            <Route path="/offline" element={<OfflinePage />} />
            
            {/* Admin Routes */}
            <Route path="/admin-p/*" element={<AdminDashboard />} />
            <Route path="/admin-p/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin-p/reset-password/:uid/:token" element={<AdminResetPassword />} />
            
            {/* Course Routes */}
            <Route path="/courses" element={<CoursesWrapper />}>
              <Route path="6th" element={<SixthStandard />} />
              <Route path="6th/cbse" element={<SixthStandard />} />
              <Route path="6th/state/:stateId" element={<SixthStandard />} />
              <Route path="7th" element={<SeventhStandard />} />
              <Route path="7th/cbse" element={<SeventhStandard />} />
              <Route path="7th/state/:stateId" element={<SeventhStandard />} />
              <Route path="8th" element={<EighthStandard />} />
              <Route path="8th/cbse" element={<EighthStandard />} />
              <Route path="8th/state/:stateId" element={<EighthStandard />} />
              <Route path="9th" element={<NinthStandard />} />
              <Route path="9th/cbse" element={<NinthStandard />} />
              <Route path="9th/state/:stateId" element={<NinthStandard />} />
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
            </Route>            {/* Other Routes */}            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileLayout />
              </ProtectedRoute>
            } />
            <Route path="/feedback" element={<FeedbackPage />} />  {/* Add feedback route */}
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/terms" element={<Navigate to="/terms-and-conditions" />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/privacy" element={<Navigate to="/privacy-policy" />} />
            <Route path="/chat" element={<ChatbotWrapper />} />
            {/* 301 Redirect: Old /pro-learning URL (without courseId) redirects to /chat for SEO */}
            <Route path="/pro-learning" element={<Navigate to="/chat" replace />} />
            <Route path="/pro-learning/:courseId" element={<ProLearningPage />} />
            <Route path="/pro-learning/share/:shareId" element={<SharedProLearningPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailsWrapper />} />
            <Route path="/courses/:courseId/learning" element={<ResponsiveCourseLearningPage />} />
            {/* Canonical ID-based quiz route */}
            <Route path="/courses/:courseId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/:courseId/certificate" element={<ProtectedRoute><CertificatePreview /></ProtectedRoute>} />
            <Route path="/learning-hub" element={
              <ProtectedRoute>
                <LearningHubWrapper />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<AuthForm />} />
            
            {/* Password Reset Routes */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

            {/* Course Detail Routes */}
            <Route path="/courses/6th/cbse/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/6th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/7th/cbse/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/7th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/8th/cbse/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/8th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/9th/cbse/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/9th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/10th/cbse/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/10th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/11th/cbse/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/11th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/12th/cbse/:subjectId" element={<SchoolCourseDetails />} />            <Route path="/courses/12th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
            <Route path="/courses/engineering/:courseId" element={<CourseDetails />} />
            
            {/* Learning Routes */}
            {/* Engineering Course Routes (legacy paths retained for backward compatibility) */}
            <Route path="/courses/engineering/:courseId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/engineering/:courseId/learning/quiz" element={<StandaloneQuizPage />} />
            
            {/* 6th Class Routes */}
            <Route path="/courses/6th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/6th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/6th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/6th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            
            {/* 7th Class Routes */}
            <Route path="/courses/7th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/7th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/7th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/7th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            
            {/* 8th Class Routes */}
            <Route path="/courses/8th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/8th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/8th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/8th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            
            {/* 9th Class Routes */}
            <Route path="/courses/9th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/9th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/9th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/9th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            
            {/* 10th Class Routes */}
            <Route path="/courses/10th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/10th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/10th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/10th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            
            {/* 11th Class Routes */}
            <Route path="/courses/11th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/11th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/11th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/11th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
              {/* 12th Class Routes */}
            <Route path="/courses/12th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/12th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
            <Route path="/courses/12th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
            <Route path="/courses/12th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />

            {/* Mentoring routes removed */}
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;