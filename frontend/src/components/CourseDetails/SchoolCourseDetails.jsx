import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaPlay, FaBookReader, FaClock, FaChalkboardTeacher, FaGlobe, FaBook, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { useAuth } from '../../context/AuthContext';
import { startLearningTracking, stopLearningTracking } from '../../services/activityTracker';

const API_URL = 'http://localhost:8000';

const SchoolCourseDetails = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
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

      const response = await axios.get(
        `${API_URL}/api/courses/enrollment-status/${courseId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setIsEnrolled(response.data.is_enrolled || false);
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      // If the enrollment status endpoint doesn't exist yet, assume not enrolled
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.log('Enrollment status endpoint not available, assuming not enrolled');
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

        console.log('Fetching course with params:', { classLevel, board, subject, state });
        
        // Build API URL to fetch courses matching the parameters
        let apiUrl = `${API_URL}/api/courses/school/?class=${classLevel}`;
        
        // Add board parameter only if it exists
        if (board) {
          apiUrl += `&board=${board}`;
        }
        
        if (state && (board === 'state' || board === '')) {
          // Handle different state name formats
          const stateValue = state === 'ts' ? 'Telangana' : 
                           state === 'ap' ? 'Andhra Pradesh' : state;
          apiUrl += `&state=${stateValue}`;
        }
        
        console.log('API URL:', apiUrl);
        
        // Fetch courses matching these parameters
        const response = await axios.get(apiUrl);
        console.log('API response:', response.data);
        
        // Find the course matching the subject
        let courseData = null;
        if (response.data && Array.isArray(response.data)) {
          courseData = response.data.find(c => 
            c.subject.toLowerCase() === subject.toLowerCase()
          );
          console.log('Found matching course:', courseData);
        }
        
        if (!courseData) {
          console.warn('No matching course found');
          throw new Error('Course not found');
        }
        
        // Debug key topics and learning points specifically
        console.log('Key Topics Raw:', courseData.key_topics);
        console.log('Learning Points Raw:', courseData.learning_points);
        
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
            console.error('Error parsing key_topics:', e);
            keyTopics = [];
          }
        }
        
        if (typeof learningPoints === 'string') {
          try {
            learningPoints = JSON.parse(learningPoints);
          } catch (e) {
            console.error('Error parsing learning_points:', e);
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
          thumbnail: courseData.thumbnail,
          icon: SUBJECT_ICONS[courseData.subject] || '📚'
        };
        
        // Debug key topics and learning points after processing
        console.log('Processed Key Topics:', formattedCourse.keyTopics);
        console.log('Processed Learning Points:', formattedCourse.whatYouLearn);
        
        setCourse(formattedCourse);
        
        // Check enrollment status if user is logged in
        if (isLoggedIn) {
          checkEnrollmentStatus(formattedCourse.id);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course details');
        
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
      console.log('🎯 Starting activity tracking for School Course Details page');
      startLearningTracking();
    }

    return () => {
      if (isLoggedIn) {
        console.log('🛑 Stopping activity tracking for School Course Details page');
        stopLearningTracking();
      }
    };
  }, [isLoggedIn]);

  const handleStartLearning = async () => {
    if (!isLoggedIn) {
      toast.error('Please log in to start learning');
      navigate('/auth?mode=login');
      return;
    }

    try {
      // If user is already enrolled, navigate directly to learning page
      if (isEnrolled) {
        console.log('User already enrolled, navigating directly to learning page');
        toast.success('Welcome back! Continuing your learning journey.');
        navigate(`${location.pathname}/learning`);
        return;
      }

      // Extract course parameters from URL for new enrollment
      const classLevel = location.pathname.includes('/6th/') ? '6th' :
                        location.pathname.includes('/7th/') ? '7th' :
                        location.pathname.includes('/8th/') ? '8th' :
                        location.pathname.includes('/9th/') ? '9th' :
                        location.pathname.includes('/10th/') ? '10th' : 
                        location.pathname.includes('/11th/') ? '11th' : '12th';
      const board = boardId || 'cbse';
      const subject = subjectId || course?.subject?.toLowerCase();

      const enrollmentData = {
        course_type: 'school',
        course_id: course?.id,
        class_level: classLevel,
        board: board,
        subject: subject
      };

      console.log('Enrolling in course with data:', enrollmentData);

      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/api/courses/enroll/`, enrollmentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        if (response.data.created) {
          toast.success('Successfully enrolled in course!');
          setIsEnrolled(true); // Update enrollment status
        } else {
          toast.success('Welcome back! Continuing your learning journey.');
        }
        
        // Navigate to the learning page
        navigate(`${location.pathname}/learning`);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to start learning. Please try again.');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!course) return <div className="p-8 text-center">Course not found</div>;

  return (
    <>
    <Navbar />
    
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="course-hero-section bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-20">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
                disabled={checkingEnrollment}
                className={`w-full sm:w-auto ${
                  isEnrolled 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-indigo-500 hover:bg-indigo-600'
                } text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-sm sm:text-base
                         flex items-center justify-center sm:justify-start space-x-2 transform transition hover:scale-105
                         ${checkingEnrollment ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FaPlay className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>
                  {checkingEnrollment 
                    ? 'Checking...' 
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

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        {/* Course Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 md:mb-12">
          {course.features.map((feature, index) => (
            <div key={index} className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="bg-indigo-100 p-2 sm:p-3 rounded-lg text-indigo-600 mb-3 sm:mb-0 sm:mr-4">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Key Topics */}
        <div className="mt-6 sm:mt-8 md:mt-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Key Topics Covered</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {course.keyTopics.map((topic, index) => (
              <div key={index} className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-100">
                <span className="text-gray-800 text-xs sm:text-sm">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="mt-6 sm:mt-8 md:mt-12 bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 shadow-sm">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">What You'll Learn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {course.whatYouLearn.map((item, index) => (
              <div key={index} className="flex items-start">
                <FaCheck className="text-indigo-600 mt-1 flex-shrink-0 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="ml-3 text-gray-700 text-xs sm:text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default SchoolCourseDetails;