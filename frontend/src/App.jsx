import './App.css';
import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import proLearningHistoryService from './services/ProLearningHistoryService';
import HomePage from './components/HomePage/HomePage';
import Courses from './components/Courses/Courses';
import CoursesWrapper from './components/Courses/CoursesWrapper';
import ChatbotWrapper from './components/Chatbot/ChatbotWrapper';
import ProLearningPage from './components/ProLearning/ProLearningPage';
import CourseDetailsPage from './components/CourseDetails/CourseDetailsPage/CourseDetailsPage';
import ResponsiveCourseLearningPage from './components/CourseLearningPage/ResponsiveCourseLearningPage';
import LearningHubWrapper from './components/LearningHub/LearningHubWrapper';
import FloatingChatButton from './components/Chatbot/FloatingChatButton';
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
import CourseDetails from './components/CourseDetails/CourseDetails';
import SchoolCourseDetails from './components/CourseDetails/SchoolCourseDetails';
import Navbar from './components/Navbar/Navbar';
import MobileBottomNavigation from './components/Navigation/MobileBottomNavigation';
import AdminDashboard from './components/Admin/Dashboard/AdminDashboard';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import FeedbackPage from './components/Feedback/FeedbackPage';  // Add feedback import
import './utils/axios';

const CourseDetailsWrapper = () => {
  const { courseId } = useParams();
  
  const determineCourseType = (id) => {
    return ['6th', '7th', '8th', '9th', '10th', '11th', '12th'].some(grade => id.startsWith(grade)) ? 'school' : 'engineering';
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

  // Check if the current route is in the excludePaths array or should be excluded
  const isExcluded = excludePaths.some(path => location.pathname.startsWith(path)) || 
                     location.pathname.startsWith('/profile'); // Exclude profile page as it has its own navbar

  // Paths where we don't want mobile navigation (like auth, admin, chat, etc.)
  const noMobileNavPaths = ['/auth', '/admin-p', '/not-found', '/chat'];
  const shouldShowMobileNav = !noMobileNavPaths.some(path => location.pathname.startsWith(path));

  // Determine the navbar style based on the current route
  const getNavbarStyle = () => {
    // Light navbar for pages without hero sections or with light backgrounds
    if (location.pathname.startsWith('/help-center') || 
        location.pathname.startsWith('/feedback') ||
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
      {!isExcluded && (isMentoring ? <MentoringNavbar /> : <Navbar initialStyle={getNavbarStyle()} />)}
      
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
  const { isLoggedIn, validateAuth } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validate = async () => {
      const valid = await validateAuth();
      setIsValid(valid);
      setIsValidating(false);
    };
    validate();
  }, [validateAuth]);

  if (isValidating) {
    // Show a loading spinner while validating
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isValid) {
    // Redirect with return URL
    const currentPath = window.location.pathname;
    return <Navigate to={`/auth?mode=login&returnTo=${encodeURIComponent(currentPath)}`} />;
  }

  return children;
};

const App = () => {
  // Global ProLearning notification state
  const [proLearningHistory, setProLearningHistory] = useState([]);
  const [notifiedCourses, setNotifiedCourses] = useState(() => {
    // Load from localStorage to persist across page refreshes
    try {
      const stored = localStorage.getItem('notifiedCourses');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Load ProLearning history globally
  useEffect(() => {
    const loadHistory = () => {
      // Clean up any error items and validate data on app start
      proLearningHistoryService.cleanupErrorItems();
      proLearningHistoryService.validateAndCleanHistory();
      
      // Get the cleaned history
      const history = proLearningHistoryService.getValidHistory();
      setProLearningHistory(history);
    };
    
    loadHistory();
    
    // Listen for storage changes to update history in real-time
    const handleStorageChange = () => {
      loadHistory();
    };
    
    // Listen for custom history update events
    const handleHistoryUpdate = () => {
      loadHistory();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('prolearning-history-updated', handleHistoryUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('prolearning-history-updated', handleHistoryUpdate);
    };
  }, []);

  // Global monitoring for ProLearning course completion
  useEffect(() => {
    const checkForReadyCourses = () => {
      const readyCourses = proLearningHistory.filter(course => 
        course.status === 'ready' && !notifiedCourses.has(course.id)
      );
      
      if (readyCourses.length === 0) return;
      
      // Handle multiple courses ready at once with staggered notifications
      if (readyCourses.length === 1) {
        const course = readyCourses[0];
        // Single course notification
        setTimeout(() => {
          toast.success(
            (t) => (
              <div 
                className="flex items-center space-x-3 cursor-pointer p-2"
                onClick={() => {
                  window.open(course.url, '_blank');
                  toast.dismiss(t.id);
                }}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-bounce">
                    <span className="text-white text-xl">🎉</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">Course Ready!</p>
                  <p className="text-gray-700 font-medium">"{course.topic}" is ready to explore</p>
                  <p className="text-blue-600 font-semibold mt-1 text-sm">👆 Click anywhere to open course</p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            ),
            {
              duration: 15000, // Show for 15 seconds
              position: 'bottom-right',
              style: {
                background: 'white',
                border: '3px solid #10b981',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.1)',
                cursor: 'pointer',
                minWidth: '320px',
                maxWidth: '380px',
                zIndex: 9999,
                animation: 'slideInRight 0.5s ease-out',
              },
              icon: false, // We use custom content
            }
          );
        }, 500);
      } else {
        // Multiple courses ready - show individual notifications with delays
        readyCourses.forEach((course, index) => {
          setTimeout(() => {
            toast.success(
              (t) => (
                <div 
                  className="flex items-center space-x-3 cursor-pointer p-2"
                  onClick={() => {
                    window.open(course.url, '_blank');
                    toast.dismiss(t.id);
                  }}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index % 3 === 0 ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                      index % 3 === 1 ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                      'bg-gradient-to-r from-green-400 to-teal-400'
                    }`}>
                      <span className="text-white text-lg">🎉</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">Course Ready! ({index + 1}/{readyCourses.length})</p>
                    <p className="text-gray-700">"{course.topic}"</p>
                    <p className="text-blue-600 font-medium text-xs mt-0.5">Click to open →</p>
                  </div>
                </div>
              ),
              {
                duration: 12000 + (index * 1000), // Staggered duration
                position: 'bottom-right',
                style: {
                  background: 'white',
                  border: `2px solid ${
                    index % 3 === 0 ? '#8b5cf6' :
                    index % 3 === 1 ? '#3b82f6' :
                    '#10b981'
                  }`,
                  borderRadius: '12px',
                  boxShadow: `0 10px 25px rgba(${
                    index % 3 === 0 ? '139, 92, 246' :
                    index % 3 === 1 ? '59, 130, 246' :
                    '16, 185, 129'
                  }, 0.3)`,
                  cursor: 'pointer',
                  minWidth: '280px',
                  maxWidth: '320px',
                  zIndex: 9999 - index, // Ensure proper stacking
                  animation: 'slideInRight 0.4s ease-out',
                },
                icon: false,
              }
            );
          }, index * 1500); // Stagger notifications by 1.5 seconds
        });
      }
      
      // Mark all as notified and save to localStorage
      readyCourses.forEach(course => {
        setNotifiedCourses(prev => {
          const newSet = new Set([...prev, course.id]);
          // Save to localStorage
          try {
            localStorage.setItem('notifiedCourses', JSON.stringify([...newSet]));
          } catch (e) {
            console.warn('Failed to save notified courses to localStorage:', e);
          }
          return newSet;
        });
      });
    };

    if (proLearningHistory.length > 0) {
      checkForReadyCourses();
    }
  }, [proLearningHistory, notifiedCourses]);

  return (
    <AuthProvider>
      <ThemeProvider>
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
        <Layout excludePaths={['/admin-p', '/chat']}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* Admin Routes */}
            <Route path="/admin-p/*" element={<AdminDashboard />} />
            <Route path="/admin-p/forgot-password" element={<AdminForgotPassword />} />
            
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
            } />            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/feedback" element={<FeedbackPage />} />  {/* Add feedback route */}
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/terms" element={<Navigate to="/terms-and-conditions" />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/privacy" element={<Navigate to="/privacy-policy" />} />
            <Route path="/chat" element={<ChatbotWrapper />} />
            <Route path="/pro-learning" element={<ProLearningPage />} />
            <Route path="/pro-learning/:courseId" element={<ProLearningPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailsWrapper />} />
            <Route path="/courses/:courseId/learning" element={<ResponsiveCourseLearningPage />} />
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
            {/* Engineering Course Routes */}
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
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;