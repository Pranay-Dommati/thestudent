import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaPlay, FaClock, FaUserGraduate, FaChartLine, FaCode, FaChevronDown, FaChevronUp, FaGlobe, FaCheck, FaVideo, FaDownload, FaMobile } from 'react-icons/fa';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';
import Footer from '../Footer/Footer';
import { getEngineeringCourseById } from '../../services/courseApi';
import { startLearningTracking, stopLearningTracking } from '../../services/activityTracker';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext'; // Import useAuth

// Add this helper function at the top of your file
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `Updated ${date.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
};

const CourseDetails = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [openSections, setOpenSections] = useState({});
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
        if (courseData.thumbnail?.startsWith('http')) {
          // If it's already a full URL, use it as is
          imageUrl = courseData.thumbnail;
        } else if (courseData.thumbnail) {
          // If it's a relative path, construct the full URL
          // Make sure we don't have double slashes between API_URL and the path
          const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
          imageUrl = baseUrl + (courseData.thumbnail.startsWith('/') ? courseData.thumbnail : `/${courseData.thumbnail}`);
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
              icon: <FaClock />, 
              title: formattedDuration, 
              text: "Self-paced learning" 
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
        toast.error('Failed to load course details');
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
    if (!isLoggedIn) {
      toast.error('Please log in to start learning');
      navigate('/auth?mode=login');
      return;
    }

    try {
      const enrollmentData = {
        course_type: 'engineering',
        course_id: courseId
      };

      console.log('Enrolling in engineering course with data:', enrollmentData);

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
        } else {
          toast.info('Welcome back! Continuing your learning journey.');
        }
        
        // Navigate to the learning page
        navigate(`/courses/engineering/${courseId}/learning`);
      }
    } catch (error) {
      console.error('Error enrolling in engineering course:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to start learning. Please try again.');
      }
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
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">{course.title}</h1>
                <p className="text-sm sm:text-base text-gray-200">{course.description}</p>                <div className="space-x-2 sm:space-x-4 text-xs sm:text-sm">
                  <span>Created by {course.instructor.name}</span>
                  <span>•</span>
                  <span>{course.stats.lastUpdated}</span>
                </div>
                <button 
                  onClick={handleStartLearning}
                  className="w-full sm:w-auto bg-white text-indigo-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base
                           hover:bg-indigo-50 transition-colors"
                >
                  Start Learning Now
                </button>
              </div>
              <div className="rounded-lg overflow-hidden shadow-xl mt-4 sm:mt-0">
                <img 
                  src={course.previewImage} 
                  alt={course.title} 
                  className="w-full h-[200px] sm:h-[300px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-8">          {/* Course features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {course.keyFeatures.map((feature, index) => (
              <div key={index} className="bg-white p-4 sm:p-6 rounded-xl text-center">
                <div className="text-blue-600 text-xl sm:text-2xl mb-2 sm:mb-3">{feature.icon}</div>
                <h3 className="font-bold text-sm sm:text-base mb-1">{feature.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* What you'll learn */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">What You'll Learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {course.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <FaCheck className="text-blue-600 mt-1 flex-shrink-0 h-4 w-4" />
                      <span className="text-gray-700 text-sm sm:text-base">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course curriculum */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Course Curriculum</h2>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {course.curriculum.map((section, index) => (
                    <div key={index} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => toggleSection(index)}
                        className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center hover:bg-gray-50"
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
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Requirements</h2>
                <ul className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-2 sm:space-y-3">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700 text-sm sm:text-base">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right column - Sticky sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <button
                      onClick={handleStartLearning}
                      className="w-full bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base
                               hover:bg-indigo-700 transition-colors"
                    >
                      Start Learning Now
                    </button>
                    <div className="border-t pt-4 sm:pt-6">
                      <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">This course includes:</h3>
                      <ul className="space-y-2 sm:space-y-3">                        <li className="flex items-center text-sm sm:text-base text-gray-600">
                          <FaVideo className="mr-3 text-gray-400" />
                          {course.keyFeatures[1].title} of video content
                        </li>
                        <li className="flex items-center text-sm sm:text-base text-gray-600">
                          <FaDownload className="mr-3 text-gray-400" />
                          Downloadable resources
                        </li>
                        <li className="flex items-center text-sm sm:text-base text-gray-600">
                          <FaMobile className="mr-3 text-gray-400" />
                          Access on mobile and desktop
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