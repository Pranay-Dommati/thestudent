import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaPlay, FaBookReader, FaClock, FaChalkboardTeacher, FaGlobe, FaBook, FaCheck } from 'react-icons/fa';
import axios from '../../utils/axios';
import { toAbsoluteMedia } from '../../utils/apiOrigin';
import universalToast from '../../utils/universalToast';
import LoadingSpinner from './LoadingSpinner';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { useAuth } from '../../context/AuthContext';
import { startLearningTracking, stopLearningTracking } from '../../services/activityTracker';
import logger from '../../utils/logger';
import { stateCodeToName } from '../../utils/stateMapping';
import cache, { schoolCourseKey } from '../../services/cacheService';
import { getSchoolCourseById, getSchoolCourses } from '../../services/courseApi';

// Use shared axios instance baseURL and dev proxy for API calls

const SchoolCourseDetails = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { boardId, stateId, subjectId } = useParams();
  const { isLoggedIn } = useAuth(); // Get authentication state

  // Define subject icons mapping
  const SUBJECT_ICONS = {
    'Mathematics': '📐',
    'Physics': '🔬',
    'Chemistry': '⚗️',
    'Biology': '🧬',
    'English': '📚',
    'Hindi': '📖',
    'Social Science': '🌍',
    'Science': '🔬',
    'Computer Science': '💻',
    'General': '📘'
  };

  // Function to check if user is already enrolled
  const checkEnrollmentStatus = async (courseId) => {
    if (!isLoggedIn) {
      setIsEnrolled(false);
      return;
    }

    setCheckingEnrollment(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsEnrolled(false);
        return;
      }

      const response = await axios.get(`/courses/enrollment-status/${courseId}/`);

      setIsEnrolled(response.data.is_enrolled || false);
    } catch (error) {
      logger.error('Error checking enrollment status:', error);
      // If the enrollment status endpoint doesn't exist yet, assume not enrolled
      if (error.response?.status === 404 || error.response?.status === 401) {
        logger.log('Enrollment status endpoint not available, assuming not enrolled');
        setIsEnrolled(false);
      } else {
        setIsEnrolled(false);
      }
    } finally {
      setCheckingEnrollment(false);
    }
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        // If a specific courseId is provided in the query string, prefer fetching by ID.
        const searchParams = new URLSearchParams(location.search || '');
        const selectedCourseId = searchParams.get('courseId');
        if (selectedCourseId) {
          logger.log('Fetching school course by ID from query param:', selectedCourseId);

          const cacheKey = schoolCourseKey({ courseId: selectedCourseId });
          // Serve from cache immediately if available
          const cached = cache.get(cacheKey);
          if (cached) {
            logger.log('Cache hit for course by ID');
            const absoluteThumbCached = toAbsoluteMedia(cached.thumbnail);
            setCourse({
              id: cached.id,
              title: cached.title,
              subject: cached.subject,
              board: cached.board === 'state' && cached.state
                ? `${cached.state} State Board`
                : (cached.board || '').toUpperCase(),
              class: cached.class_level || '11th',
              lastUpdated: cached.last_updated ? new Date(cached.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Recently updated',
              features: [
                { icon: <FaChalkboardTeacher />, title: 'Expert Teachers', desc: 'Learn from experienced educators' },
                { icon: <FaBookReader />, title: 'Structured Learning', desc: 'Well-organized chapter-wise content' },
                { icon: <FaClock />, title: 'Self-Paced', desc: 'Learn at your own convenience' }
              ],
              keyTopics: Array.isArray(cached.key_topics) ? cached.key_topics : [],
              whatYouLearn: Array.isArray(cached.learning_points) ? cached.learning_points : [],
              duration: cached.duration || '20',
              chapters: Array.isArray(cached.chapters) ? cached.chapters.length : (Array.isArray(cached.sections) ? cached.sections.length : 0),
              sources: cached.sources || 'YouTube',
              thumbnail: absoluteThumbCached || cached.thumbnail,
              icon: SUBJECT_ICONS[cached.subject] || '📚'
            });
            setLoading(false);
          }

          const courseData = await getSchoolCourseById(selectedCourseId);

          // Build absolute thumbnail URL when backend returns a relative media path
          const absoluteThumb = toAbsoluteMedia(courseData.thumbnail);

          const formattedCourse = {
            id: courseData.id,
            title: courseData.title,
            subject: courseData.subject,
            board: courseData.board === 'state' && courseData.state
              ? `${courseData.state} State Board`
              : (courseData.board || '').toUpperCase(),
            class: courseData.class_level || '11th',
            lastUpdated: courseData.last_updated ? new Date(courseData.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Recently updated',
            features: [
              { icon: <FaChalkboardTeacher />, title: 'Expert Teachers', desc: 'Learn from experienced educators' },
              { icon: <FaBookReader />, title: 'Structured Learning', desc: 'Well-organized chapter-wise content' },
              { icon: <FaClock />, title: 'Self-Paced', desc: 'Learn at your own convenience' }
            ],
            keyTopics: Array.isArray(courseData.key_topics) ? courseData.key_topics : [],
            whatYouLearn: Array.isArray(courseData.learning_points) ? courseData.learning_points : [],
            duration: courseData.duration || '20',
            chapters: Array.isArray(courseData.chapters) ? courseData.chapters.length : 0,
            sources: courseData.sources || 'YouTube',
            thumbnail: absoluteThumb || courseData.thumbnail,
            icon: SUBJECT_ICONS[courseData.subject] || '📚'
          };

          setCourse(formattedCourse);
          // Cache the raw API response instead of formatted object for key consistency across pages
          cache.set(cacheKey, courseData, 10 * 60_000);
          if (isLoggedIn) {
            checkEnrollmentStatus(formattedCourse.id);
          }
          return; // Done for by-id fetch
        }

        // Extract parameters from the URL
        const classLevel = location.pathname.includes('/6th/') ? '6th' :
                          location.pathname.includes('/7th/') ? '7th' :
                          location.pathname.includes('/8th/') ? '8th' :
                          location.pathname.includes('/9th/') ? '9th' :
                          location.pathname.includes('/10th/') ? '10th' : 
                          location.pathname.includes('/11th/') ? '11th' : '12th';
        const board = boardId || '';
        const subject = subjectId || '';
        const state = stateId || '';

  logger.log('Fetching course with params:', { classLevel, board, subject, state });
        
        // Build normalized params
        const stateValue = state && (board === 'state' || board === '') ? stateCodeToName(state) : '';
        const swrKey = schoolCourseKey({ classLevel, board, state: stateValue, subject });

        // Instant cache serve if present
        const cached = cache.get(swrKey);
        if (cached) {
          logger.log('Cache hit for school course preview');
          const absoluteThumb = toAbsoluteMedia(cached.thumbnail);
          const displayBoardCached = cached.board === 'state' && cached.state ? `${cached.state} State Board` : (cached.board || '').toUpperCase();
          const keyTopicsCached = typeof cached.key_topics === 'string' ? (JSON.parse(cached.key_topics || '[]')) : cached.key_topics;
          const learningCached = typeof cached.learning_points === 'string' ? (JSON.parse(cached.learning_points || '[]')) : cached.learning_points;
          setCourse({
            id: cached.id,
            title: cached.title,
            subject: cached.subject,
            board: displayBoardCached,
            class: classLevel,
            lastUpdated: cached.last_updated ? new Date(cached.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Recently updated',
            features: [
              { icon: <FaChalkboardTeacher />, title: 'Expert Teachers', desc: 'Learn from experienced educators' },
              { icon: <FaBookReader />, title: 'Structured Learning', desc: 'Well-organized chapter-wise content' },
              { icon: <FaClock />, title: 'Self-Paced', desc: 'Learn at your own convenience' }
            ],
            keyTopics: Array.isArray(keyTopicsCached) ? keyTopicsCached : [],
            whatYouLearn: Array.isArray(learningCached) ? learningCached : [],
            duration: cached.duration || '20',
            chapters: Array.isArray(cached.chapters) ? cached.chapters.length : 0,
            sources: cached.sources || 'YouTube',
            thumbnail: absoluteThumb,
            icon: SUBJECT_ICONS[cached.subject] || '📚'
          });
          setLoading(false);
        }

        // Fetch courses list (cached per list) then find subject
        const list = await getSchoolCourses(classLevel, board || (state ? 'state' : ''), stateValue);
        logger.log('API/list response:', list);
        
        // Find the course matching the subject
        let courseData = null;
        if (list && Array.isArray(list)) {
          courseData = list.find(c => 
            c.subject.toLowerCase() === subject.toLowerCase()
          );
          logger.log('Found matching course:', courseData);
        }
        
        if (!courseData) {
          logger.warn('No matching course found');
          throw new Error('Course not found');
        }
        
        // Debug key topics and learning points specifically
        logger.log('Key Topics Raw:', courseData.key_topics);
        logger.log('Learning Points Raw:', courseData.learning_points);
        
        // Format the board display value properly
        let displayBoard = courseData.board.toUpperCase();
        if (courseData.board === 'state' && courseData.state) {
          // For state boards, show state name instead of just "STATE"
          const stateName = courseData.state;
          displayBoard = `${stateName} State Board`;
        }
        
        // Get number of chapters (sections) for this course
        let chapterCount = 0;
        if (courseData.chapters && Array.isArray(courseData.chapters)) {
          chapterCount = courseData.chapters.length;
        }
        
        // Ensure key_topics and learning_points are parsed correctly if they're strings
        let keyTopics = courseData.key_topics;
        let learningPoints = courseData.learning_points;
        
        // If they're strings (JSON), parse them
        if (typeof keyTopics === 'string') {
          try {
            keyTopics = JSON.parse(keyTopics);
          } catch (e) {
            logger.error('Error parsing key_topics:', e);
            keyTopics = [];
          }
        }
        
        if (typeof learningPoints === 'string') {
          try {
            learningPoints = JSON.parse(learningPoints);
          } catch (e) {
            logger.error('Error parsing learning_points:', e);
            learningPoints = [];
          }
        }
        
        // Format the course data for display
        const formattedCourse = {
          id: courseData.id,
          title: courseData.title,
          subject: courseData.subject,
          board: displayBoard,
          class: classLevel,
          lastUpdated: courseData.last_updated ? new Date(courseData.last_updated).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long'
          }) : "Recently updated",
          // Static features as requested
          features: [
            { icon: <FaChalkboardTeacher />, title: "Expert Teachers", desc: "Learn from experienced educators" },
            { icon: <FaBookReader />, title: "Structured Learning", desc: "Well-organized chapter-wise content" },
            { icon: <FaClock />, title: "Self-Paced", desc: "Learn at your own convenience" }
          ],
          // Ensure the arrays are properly handled
          keyTopics: Array.isArray(keyTopics) && keyTopics.length > 0 
            ? keyTopics 
            : ["No topics available"],
          whatYouLearn: Array.isArray(learningPoints) && learningPoints.length > 0 
            ? learningPoints 
            : ["No learning points available"],
          // Use duration from database, but show as "X+ hours"
          duration: courseData.duration || "20",
          chapters: chapterCount,
          sources: courseData.sources || "YouTube",
          // Use the actual thumbnail path from the database
          thumbnail: toAbsoluteMedia(courseData.thumbnail),
          icon: SUBJECT_ICONS[courseData.subject] || '📚'
        };
        
        // Debug key topics and learning points after processing
  logger.log('Processed Key Topics:', formattedCourse.keyTopics);
  logger.log('Processed Learning Points:', formattedCourse.whatYouLearn);
        
        setCourse(formattedCourse);
        // Store raw course object in cache for direct reuse
        cache.set(swrKey, courseData, 10 * 60_000);
        
        // Check enrollment status if user is logged in
        if (isLoggedIn) {
          checkEnrollmentStatus(formattedCourse.id);
        }
      } catch (error) {
        logger.error('Error fetching course:', error);
        universalToast.error('Failed to load course details');
        
        // Fallback to dummy data in case of error
        const fallbackClassLevel = location.pathname.includes('/6th/') ? '6th' :
                         location.pathname.includes('/7th/') ? '7th' :
                         location.pathname.includes('/8th/') ? '8th' :
                         location.pathname.includes('/9th/') ? '9th' :
                         location.pathname.includes('/10th/') ? '10th' : 
                         location.pathname.includes('/11th/') ? '11th' : '12th';
        const fallbackBoard = boardId || '';
        const fallbackSubject = subjectId || '';
        
        setCourse({
          id: 1,
          title: `${fallbackClassLevel.toUpperCase()} ${fallbackBoard.toUpperCase()} ${fallbackSubject}`,
          subject: fallbackSubject,
          board: fallbackBoard.toUpperCase(),
          class: fallbackClassLevel,
          lastUpdated: "April 2025",
          features: [
            { icon: <FaChalkboardTeacher />, title: "Expert Teachers", desc: "Learn from experienced educators" },
            { icon: <FaBookReader />, title: "Structured Learning", desc: "Well-organized chapter-wise content" },
            { icon: <FaClock />, title: "Self-Paced", desc: "Learn at your own convenience" }
          ],
          keyTopics: ["Real Numbers", "Polynomials", "Coordinate Geometry", "Triangles", "Statistics"],
          whatYouLearn: [
            "Master fundamental mathematical concepts",
            "Solve complex problems step by step",
            "Practice with previous year questions",
            "Prepare effectively for board exams"
          ],
          duration: "40",
          chapters: 15,
          sources: "YouTube",
          thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
          icon: SUBJECT_ICONS[fallbackSubject] || '📚'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [location.pathname, boardId, stateId, subjectId, isLoggedIn]);

  // Activity tracking for learning time
  useEffect(() => {
    if (isLoggedIn) {
      logger.log('🎯 Starting activity tracking for School Course Details page');
      startLearningTracking();
    }

    return () => {
      if (isLoggedIn) {
        logger.log('🛑 Stopping activity tracking for School Course Details page');
        stopLearningTracking();
      }
    };
  }, [isLoggedIn]);

  const handleStartLearning = async () => {
    if (isStarting) return; // guard against rapid clicks
    if (!isLoggedIn) {
      universalToast.error('Please log in to start learning', { id: 'start-learning' });
      const returnTo = `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`;
      navigate(`/auth?mode=login&returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    try {
      setIsStarting(true);
      // If user is already enrolled, navigate directly to learning page
      if (isEnrolled) {
        logger.log('User already enrolled, navigating directly to learning page');
        universalToast.success('Welcome back! Continuing your learning journey.', { id: 'start-learning' });
  // Preserve any query params (like ?courseId=...) for downstream pages
  navigate({ pathname: `${location.pathname}/learning`, search: location.search });
        return;
      }

      // Extract course parameters from URL for new enrollment
      const classLevel = location.pathname.includes('/6th/') ? '6th' :
                        location.pathname.includes('/7th/') ? '7th' :
                        location.pathname.includes('/8th/') ? '8th' :
                        location.pathname.includes('/9th/') ? '9th' :
                        location.pathname.includes('/10th/') ? '10th' : 
                        location.pathname.includes('/11th/') ? '11th' : '12th';
      const board = boardId || '';
      const subject = subjectId || course?.subject?.toLowerCase();
      const stateName = stateId ? stateCodeToName(stateId) : '';

      const enrollmentData = {
        course_type: 'school',
        course_id: course?.id,
        class_level: classLevel,
        board: board,
        subject: subject,
        // Not currently persisted by backend, but included for clarity and future-proofing
        ...(board === 'state' && stateName ? { state: stateName } : {})
      };

  logger.log('Enrolling in course with data:', enrollmentData);

      const response = await axios.post(`/courses/enroll/`, enrollmentData);

      if (response.data.success) {
        if (response.data.created) {
          universalToast.success('Successfully enrolled in course!', { id: 'start-learning' });
          setIsEnrolled(true); // Update enrollment status
        } else {
          universalToast.success('Welcome back! Continuing your learning journey.', { id: 'start-learning' });
        }
        
        // Navigate to the learning page
        navigate(`${location.pathname}/learning`);
      }
    } catch (error) {
      logger.error('Error enrolling in course:', error);
      if (error.response?.data?.error) {
        universalToast.error(error.response.data.error, { id: 'start-learning' });
      } else {
        universalToast.error('Failed to start learning. Please try again.', { id: 'start-learning' });
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!course) return <div className="p-8 text-center">Course not found</div>;

  return (
    <>
    <Navbar />
    
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
  <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-16 md:pt-20 pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">{course.title}</h1>
                <p className="text-lg sm:text-xl text-blue-200 font-medium mb-4">Complete Mastery Course</p>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-200 mb-4 sm:mb-6 text-xs sm:text-sm">
                  <span className="bg-white/10 backdrop-blur-sm rounded px-3 py-1">{course.board}</span>
                  <span className="bg-white/10 backdrop-blur-sm rounded px-3 py-1">{course.class} Standard</span>
                  <span className="bg-white/10 backdrop-blur-sm rounded px-3 py-1">{course.subject}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                <span className="flex items-center">
                  <FaChalkboardTeacher className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Expert Teachers
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center">
                  <FaClock className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {course.duration}+ hours
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <FaGlobe className="text-base sm:text-lg" />
                  <span className="text-xs sm:text-sm md:text-base">Sources: {course.sources}</span>
                </div>
              </div>

              <button 
                onClick={handleStartLearning}
                disabled={checkingEnrollment || isStarting}
                aria-busy={isStarting}
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-sm sm:text-base
                         flex items-center justify-center sm:justify-start space-x-2 transform transition-all duration-200
                         ${checkingEnrollment || isStarting 
                           ? 'bg-white/50 text-white/70 cursor-not-allowed' 
                           : 'bg-white/90 text-indigo-700 hover:bg-white hover:scale-[1.02] shadow-sm hover:shadow-md'}`}
              >
                <FaPlay className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>
                  {checkingEnrollment
                    ? 'Checking...'
                    : isStarting
                      ? 'Starting...'
                      : isEnrolled
                        ? 'Continue Learning'
                        : 'Start Learning Now'}
                </span>
              </button>
            </div>

            {/* Course Image with Elegant Frame */}
            <div className="relative mt-4 sm:mt-0">
              <div className="relative">
                {/* Subtle Background Glow */}
                <div className="absolute -inset-2 bg-white/10 rounded-2xl blur-sm"></div>
                
                {/* Main Image Container with Thin Transparent Border */}
                <div className="relative bg-transparent border border-white/20 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm">
                  <img 
                    loading="lazy"
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-[280px] sm:h-[320px] md:h-[360px] lg:h-[400px] object-cover transition-all duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb";
                    }}
                  />
                  
                  {/* Subtle Inner Glow */}
                  <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

  <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-8 md:py-12 pb-16 md:pb-12">
        {/* Course Features */}
        <div className="space-y-4 sm:space-y-5 md:grid md:grid-cols-3 md:gap-6 md:space-y-0 mb-8 sm:mb-10 md:mb-12">
          {course.features.map((feature, index) => (
            <div key={index} className="flex items-start md:block md:bg-white md:p-6 md:rounded-xl md:shadow-sm md:border md:border-gray-200 md:hover:shadow-md md:transition-shadow">
              <div className="text-indigo-500 mt-1 flex-shrink-0 text-lg sm:text-xl md:bg-indigo-100 md:p-3 md:rounded-lg md:text-indigo-600 md:mb-4 md:inline-block">
                {feature.icon}
              </div>
              <div className="ml-3 sm:ml-4 md:ml-0">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 md:mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed mt-0.5 md:mt-0">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Key Topics */}
        <div className="mt-6 sm:mt-8 md:mt-12">
          <div className="flex items-center justify-between mb-5 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Key Topics Covered</h2>
            {course.keyTopics.length > 6 && (
              <button
                onClick={() => setShowAllTopics(!showAllTopics)}
                className="text-indigo-600 hover:text-indigo-700 text-sm sm:text-base font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {showAllTopics ? 'Show Less' : 'Show All'}
                <svg 
                  className={`w-4 h-4 transition-transform ${showAllTopics ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="space-y-3 sm:space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {(showAllTopics ? course.keyTopics : course.keyTopics.slice(0, 6)).map((topic, index) => (
              <div key={index} className="flex items-start md:bg-white md:border md:border-gray-100 md:rounded-lg md:p-4">
                <FaBook className="text-indigo-500 mt-1 flex-shrink-0 h-3 w-3 sm:h-3.5 sm:w-3.5 md:w-8 md:h-8 md:bg-indigo-50 md:rounded-md md:p-2 md:mt-0" />
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-gray-800 text-sm sm:text-base md:text-lg font-medium md:font-semibold">{topic}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-0.5">
                    Chapter {index + 1} • Essential concept
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {course.keyTopics.length > 6 && !showAllTopics && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllTopics(true)}
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                View {course.keyTopics.length - 6} more topics
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* What You'll Learn */}
        <div className="mt-6 sm:mt-8 md:mt-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 sm:p-7 md:p-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-5 sm:mb-6 md:mb-7 text-gray-900">What You'll Learn</h2>
            <div className="space-y-3 sm:space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
              {course.whatYouLearn.map((item, index) => (
                <div key={index} className="flex items-start md:p-4 md:bg-white md:border md:border-gray-200 md:rounded-lg">
                  <FaCheck className="text-green-500 mt-1 flex-shrink-0 h-3 w-3 sm:h-3.5 sm:w-3.5 md:w-5 md:h-5 md:mt-0.5" />
                  <span className="ml-3 sm:ml-4 text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed md:font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default SchoolCourseDetails;