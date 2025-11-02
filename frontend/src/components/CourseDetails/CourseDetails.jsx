import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaPlay, FaClock, FaUserGraduate, FaChartLine, FaCode, FaChevronDown, FaChevronUp, FaGlobe, FaCheck, FaVideo, FaDownload, FaMobile, FaChalkboardTeacher } from 'react-icons/fa';
import axios from '../../utils/axios';
import LoadingSpinner from './LoadingSpinner';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { getEngineeringCourseById } from '../../services/courseApi';
import { toAbsoluteMedia } from '../../utils/apiOrigin';
import { startLearningTracking, stopLearningTracking } from '../../services/activityTracker';
import universalToast from '../../utils/universalToast';
import { useAuth } from '../../context/AuthContext';

// Add this helper function at the top of your file
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `Updated ${date.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
};

const CourseDetails = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [openSections, setOpenSections] = useState({});
  const [isStarting, setIsStarting] = useState(false);
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth(); // Get authentication state

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        const courseData = await getEngineeringCourseById(courseId);
        
        // Format the duration to append "hours" if it's not already there
        const formattedDuration = courseData.duration.toLowerCase().includes('hours') 
          ? courseData.duration 
          : `${courseData.duration} hours`;

        // Fix the image URL construction
        let imageUrl;
        if (courseData.thumbnail) {
          imageUrl = toAbsoluteMedia(courseData.thumbnail);
        } else {
          // Fallback if no thumbnail is provided
          imageUrl = '/default-course-thumbnail.jpg';
        }

        console.log("Using image URL:", imageUrl); // Debug the final URL

        setCourse({
          id: courseData.id,
          title: courseData.title,
          subtitle: courseData.short_description || courseData.title,
          instructor: {
            name: "Sources:",
            role: courseData.sources || "YouTube",
            company: "",
            avatar: "",
          },
          stats: {
            students: "0", // Removed as requested
            rating: 4.8,
            reviews: 0,
            lastUpdated: formatDate(courseData.last_updated)
          },
          keyFeatures: [
            { 
              icon: <FaUserGraduate />, 
              title: courseData.proficiency || "Beginner to Advanced", 
              text: "No prior experience needed" 
            },
            { 
              icon: <FaChartLine />, 
              title: courseData.project_based ? "Project-Based Learning" : "Practical Learning", 
              text: courseData.project_based ? "Build Real Projects" : "Hands-on Practice"
            },
            { 
              icon: <FaCode />, 
              title: "Coding Drills", 
              text: "Code along with guided exercises" 
            }
          ],
          thumbnail: imageUrl,
          previewImage: imageUrl,
          description: courseData.description,
          highlights: courseData.learning_points || [],
          curriculum: courseData.sections.map(section => ({
            title: section.name,
            lectures: section.lessons.map(lesson => ({
              title: lesson.title,
              duration: "" // Empty string since we're not showing duration
            }))
          })),
          requirements: courseData.requirements || []
        });
      } catch (error) {
        console.error('Error fetching course details:', error);
        universalToast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  // Activity tracking useEffect - Start tracking when viewing course details
  useEffect(() => {
    if (isLoggedIn) {
      console.log('🎯 Starting learning activity tracking for CourseDetails page');
      startLearningTracking();
      
      return () => {
        console.log('⏹️ Stopping learning activity tracking for CourseDetails page');
        stopLearningTracking();
      };
    }
  }, [isLoggedIn]); // Track when user is logged in

  const handleStartLearning = async () => {
    if (isStarting) return; // guard against double-clicks
    // Guest users go straight to preview (no enrollment)
    if (!isLoggedIn) {
      navigate(`/courses/engineering/${courseId}/learning`);
      return;
    }

    try {
      setIsStarting(true);
      const enrollmentData = {
        course_type: 'engineering',
        course_id: courseId
      };

      console.log('Enrolling in engineering course with data:', enrollmentData);

      const response = await axios.post(`/courses/enroll/`, enrollmentData);

      if (response.data.success) {
        if (response.data.created) {
          universalToast.success('Successfully enrolled in course!', { id: 'start-learning' });
        } else {
          universalToast.success('Welcome back! Continuing your learning journey.', { id: 'start-learning' });
        }
        
        // Navigate to the learning page
        navigate(`/courses/engineering/${courseId}/learning`);
      }
    } catch (error) {
      console.error('Error enrolling in engineering course:', error);
      if (error.response?.data?.error) {
        universalToast.error(error.response.data.error, { id: 'start-learning' });
      } else {
        universalToast.error('Failed to start learning. Please try again.', { id: 'start-learning' });
      }
    } finally {
      setIsStarting(false);
    }
  };

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div>Course not found</div>;

  return (
    <>
    <Navbar />
    
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-20">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">{course.title}</h1>
                <p className="text-lg sm:text-xl text-blue-200 font-medium mb-4">Professional Engineering Course</p>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-200 mb-4 sm:mb-6 text-xs sm:text-sm">
                  <span className="bg-white/10 backdrop-blur-sm rounded px-3 py-1">Engineering</span>
                  <span className="bg-white/10 backdrop-blur-sm rounded px-3 py-1">{course.keyFeatures[0]?.title || 'All Levels'}</span>
                  <span className="bg-white/10 backdrop-blur-sm rounded px-3 py-1">Professional</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                <span className="flex items-center">
                  <FaChalkboardTeacher className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Expert Instructors
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center">
                  <FaClock className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {course.keyFeatures[1]?.title || 'Self-paced'}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <FaGlobe className="text-base sm:text-lg" />
                  <span className="text-xs sm:text-sm md:text-base">Sources: {course.instructor?.role || 'Professional Content'}</span>
                </div>
              </div>

              <button 
                onClick={handleStartLearning}
                className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-sm sm:text-base
                         flex items-center justify-center sm:justify-start space-x-2 transform transition hover:scale-105"
              >
                <FaPlay className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{isLoggedIn ? 'Start Learning Now' : 'Preview Course'}</span>
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
                    src={course.previewImage} 
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
            {course.keyFeatures.map((feature, index) => (
              <div key={index} className="bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                <div className="bg-indigo-100 p-2 sm:p-3 rounded-lg text-indigo-600 mb-3 sm:mb-0 sm:mr-4">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* What you'll learn */}
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 shadow-sm">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">What You'll Learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {course.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start">
                      <FaCheck className="text-indigo-600 mt-1 flex-shrink-0 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="ml-3 text-gray-700 text-xs sm:text-sm">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course curriculum */}
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Course Curriculum</h2>
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
                  {course.curriculum.map((section, index) => (
                    <div key={index} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => toggleSection(index)}
                        className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-sm sm:text-base">{section.title}</span>
                        <span className={`transform transition-transform duration-200 ${
                          openSections[index] ? 'rotate-180' : ''
                        }`}>
                          <FaChevronDown />
                        </span>
                      </button>
                      {openSections[index] && (
                        <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50">
                          <ul className="space-y-1">
                            {section.lectures.map((lecture, lectureIndex) => (
                              <li key={lectureIndex} className="text-sm sm:text-base text-gray-600 py-1">
                                {lecture.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Requirements</h2>
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                  <ul className="space-y-2 sm:space-y-3">
                    {course.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <FaCheck className="text-indigo-600 mt-1 flex-shrink-0 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="ml-3 text-gray-700 text-xs sm:text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right column - Sticky sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <button
                      onClick={handleStartLearning}
                      disabled={isStarting}
                      aria-busy={isStarting}
                      className={`w-full text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-medium text-sm sm:text-base transition-colors transform flex items-center justify-center space-x-2 ${isStarting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'}`}
                    >
                      <FaPlay className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{isStarting ? 'Starting...' : 'Start Learning Now'}</span>
                    </button>
                    <div className="border-t pt-4 sm:pt-6">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">This course includes:</h3>
                      <ul className="space-y-3 sm:space-y-4">
                        <li className="flex items-center text-sm sm:text-base text-gray-600">
                          <FaVideo className="mr-3 text-indigo-600 h-4 w-4" />
                          {course.keyFeatures[1]?.title || 'Video content'}
                        </li>
                        <li className="flex items-center text-sm sm:text-base text-gray-600">
                          <FaDownload className="mr-3 text-indigo-600 h-4 w-4" />
                          Downloadable resources
                        </li>
                        <li className="flex items-center text-sm sm:text-base text-gray-600">
                          <FaMobile className="mr-3 text-indigo-600 h-4 w-4" />
                          Access on mobile and desktop
                        </li>
                        <li className="flex items-center text-sm sm:text-base text-gray-600">
                          <FaCheck className="mr-3 text-indigo-600 h-4 w-4" />
                          Professional certification
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetails;