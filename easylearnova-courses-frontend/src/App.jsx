import './App.css';
import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';

// Course components
import Courses from './components/Courses/Courses';
import CoursesWrapper from './components/Courses/CoursesWrapper';
import CourseDetailsPage from './components/CourseDetails/CourseDetailsPage/CourseDetailsPage';
const ResponsiveCourseLearningPage = React.lazy(() => import('./components/CourseLearningPage/ResponsiveCourseLearningPage'));
import LearningHubWrapper from './components/LearningHub/LearningHubWrapper';

// Auth components
import AuthForm from './components/Auth/AuthForm';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

// Course category components
import SixthStandard from './components/Courses/categories/6th/SixthStandard';
import SeventhStandard from './components/Courses/categories/7th/SeventhStandard';
import EighthStandard from './components/Courses/categories/8th/EighthStandard';
import NinthStandard from './components/Courses/categories/9th/NinthStandard';
import TenthStandard from './components/Courses/categories/10th/TenthStandard';
import EleventhStandard from './components/Courses/categories/11th/EleventhStandard';
import TwelfthStandard from './components/Courses/categories/12th/TwelfthStandard';
import Undergraduate from './components/Courses/categories/engineering/ResponsiveEngineeringCourses';

// Other components
import ProfileLayout from './components/Profile/ProfilePageNew';
const CourseDetails = React.lazy(() => import('./components/CourseDetails/CourseDetails'));
const SchoolCourseDetails = React.lazy(() => import('./components/CourseDetails/SchoolCourseDetails'));
import CoursesNavbar from './components/Navbar/CoursesNavbar';
import MobileBottomNavigation from './components/Navigation/MobileBottomNavigation';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import StandaloneQuizPage from './components/CourseLearningPage/templ/StandaloneQuizPage';
import NotFound from './components/NotFound/NotFound';
import TermsAndConditions from './components/Legal/TermsAndConditions';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import FeedbackPage from './components/Feedback/FeedbackPage';
import './utils/axios';
import ScrollManager from './components/Common/ScrollManager.jsx';
import OnlineStatusToaster from './components/Common/OnlineStatusToaster.jsx';
import OfflineRouterHandler from './components/Common/OfflineRouterHandler.jsx';
import OfflinePage from './components/Common/OfflinePage.jsx';
const CertificatePreview = React.lazy(() => import('./components/Certificates/CertificatePreview'));
import OnboardingModal from './components/Onboarding/OnboardingModal';

// Course Creator components
import ChatbotWrapper from './components/Chatbot/ChatbotWrapper';
import ProLearningPage from './components/ProLearning';
import SharedProLearningPage from './components/ProLearning/public/SharedProLearningPage';
import GlobalBackgroundGenerationCard from './components/ProLearning/GlobalBackgroundGenerationCard';

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

    // Special cases: pages that should not show global navbars
    const isCertificatePage = /^\/[^/]+\/certificate(\/|$)?/.test(location.pathname);
    const isLearningPage = /^\/[^/]+\/learning(\/|$)?/.test(location.pathname);

    // Check if the current route should be excluded
    const isExcluded = excludePaths.some(path => location.pathname.startsWith(path)) ||
        location.pathname.startsWith('/profile') ||
        isCertificatePage ||
        isLearningPage;

    // Paths where we don't want mobile navigation
    const noMobileNavPaths = ['/auth'];
    const shouldShowMobileNav = !noMobileNavPaths.some(path => location.pathname.startsWith(path)) && !isCertificatePage && !isLearningPage;

    // Determine the navbar style based on the current route
    const getNavbarStyle = () => {
        if (location.pathname.startsWith('/feedback') ||
            location.pathname.startsWith('/terms') ||
            location.pathname.startsWith('/privacy') ||
            location.pathname.startsWith('/profile')) {
            return 'light';
        }

        if (location.pathname === '/' ||
            location.pathname.startsWith('/learning-hub')) {
            return 'transparent';
        }

        return 'transparent';
    };

    return (
        <>
            {/* Desktop Navigation - Use CoursesNavbar (no Code Visualizer/Course Creator links) */}
            {!isExcluded && <CoursesNavbar initialStyle={getNavbarStyle()} />}

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

// Protected route component
const ProtectedRoute = ({ children }) => {
    const { validateAuth } = useAuth();
    const location = useLocation();
    const [isValidating, setIsValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        const validate = async () => {
            const valid = await validateAuth();
            setIsValid(valid);
            setIsValidating(false);
        };
        validate();
    }, [validateAuth, location.pathname, location.search, location.hash]);

    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isValid) {
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
                        duration: 4000,
                        style: {
                            background: '#333',
                            color: '#fff',
                        },
                    }}
                />
                <BrowserRouter>
                    <ScrollManager />
                    <OnlineStatusToaster />
                    <OfflineRouterHandler />
                    <OnboardingModal />
                    <GlobalBackgroundGenerationCard />

                    <Layout excludePaths={['/offline']}>
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                            <Routes>
                                {/* Home = Course listing */}
                                <Route path="/" element={<CoursesWrapper />}>
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
                                </Route>

                                {/* /courses/* routes - for compatibility with existing links */}
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
                                </Route>

                                {/* Offline fallback page */}
                                <Route path="/offline" element={<OfflinePage />} />

                                {/* User routes */}
                                <Route path="/profile" element={
                                    <ProtectedRoute>
                                        <ProfileLayout />
                                    </ProtectedRoute>
                                } />
                                <Route path="/feedback" element={<FeedbackPage />} />
                                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                                <Route path="/terms" element={<Navigate to="/terms-and-conditions" />} />
                                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                <Route path="/privacy" element={<Navigate to="/privacy-policy" />} />

                                {/* Learning Hub */}
                                <Route path="/learning-hub" element={
                                    <ProtectedRoute>
                                        <LearningHubWrapper />
                                    </ProtectedRoute>
                                } />

                                {/* Auth routes */}
                                <Route path="/auth" element={<AuthForm />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

                                {/* Course Creator routes - Public access (no login required) */}
                                <Route path="/chat" element={<ChatbotWrapper />} />
                                <Route path="/pro-learning" element={<ProLearningPage />} />
                                <Route path="/pro-learning/:courseId" element={<ProLearningPage />} />
                                <Route path="/pro-learning/share/:shareId" element={<SharedProLearningPage />} />

                                {/* Course detail routes - Using root-level paths for future subdomain */}
                                <Route path="/:courseId" element={<CourseDetailsWrapper />} />
                                <Route path="/:courseId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/:courseId/learning/quiz" element={<StandaloneQuizPage />} />
                                <Route path="/:courseId/certificate" element={<ProtectedRoute><CertificatePreview /></ProtectedRoute>} />

                                {/* /courses/* versions of course detail routes for compatibility */}
                                <Route path="/courses/:courseId" element={<CourseDetailsWrapper />} />
                                <Route path="/courses/:courseId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/courses/:courseId/learning/quiz" element={<StandaloneQuizPage />} />
                                <Route path="/courses/:courseId/certificate" element={<ProtectedRoute><CertificatePreview /></ProtectedRoute>} />

                                {/* School course detail routes */}
                                <Route path="/6th/cbse/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/6th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/7th/cbse/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/7th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/8th/cbse/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/8th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/9th/cbse/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/9th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/10th/cbse/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/10th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/11th/cbse/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/11th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/12th/cbse/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/12th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/engineering/:courseId" element={<CourseDetails />} />

                                {/* /courses/* versions of school course detail routes */}
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
                                <Route path="/courses/12th/cbse/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/courses/12th/state/:stateId/:subjectId" element={<SchoolCourseDetails />} />
                                <Route path="/courses/engineering/:courseId" element={<CourseDetails />} />

                                {/* Learning Routes for school courses */}
                                <Route path="/engineering/:courseId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/engineering/:courseId/learning/quiz" element={<StandaloneQuizPage />} />

                                <Route path="/6th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/6th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
                                <Route path="/6th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/6th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />

                                <Route path="/7th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/7th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
                                <Route path="/7th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/7th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />

                                <Route path="/8th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/8th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
                                <Route path="/8th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/8th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />

                                <Route path="/9th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/9th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
                                <Route path="/9th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/9th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />

                                <Route path="/10th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/10th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
                                <Route path="/10th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/10th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />

                                <Route path="/11th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/11th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
                                <Route path="/11th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/11th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />

                                <Route path="/12th/cbse/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/12th/cbse/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />
                                <Route path="/12th/state/:stateId/:subjectId/learning" element={<ResponsiveCourseLearningPage />} />
                                <Route path="/12th/state/:stateId/:subjectId/learning/quiz" element={<StandaloneQuizPage />} />

                                {/* 404 */}
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
