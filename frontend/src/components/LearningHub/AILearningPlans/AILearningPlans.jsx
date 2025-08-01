import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBrain, FaPlay, FaCheckCircle, FaClock, FaChartLine, FaTrash, FaEllipsisV, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const AILearningPlans = () => {
  const navigate = useNavigate();
  const [proCourses, setProCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const COURSES_TO_SHOW = 6;

  useEffect(() => {
    fetchProCourses();
  }, []);

  const fetchProCourses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      console.log('🔥 [AI COURSES] Fetching Pro Learning courses...');
      const response = await axios.get(`${API_URL}/api/courses/pro-learning/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔥 [AI COURSES] Pro courses response:', response.data);
      setProCourses(response.data.results || response.data || []);
      setError(null);
    } catch (error) {
      console.error('❌ [AI COURSES] Error fetching pro courses:', error);
      if (error.response?.status === 401) {
        setError('Please log in to view your AI-created courses');
      } else {
        setError('Failed to load AI-created courses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = async (courseId, courseName) => {
    console.log('🎯 Start button clicked for course:', courseId, courseName);
    try {
      // Add loading toast
      toast.loading(`Loading ${courseName}...`, { id: `loading-${courseId}` });
      
      // Optional: Check if course is accessible before navigation
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/courses/pro-learning/${courseId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        toast.success('Course loaded successfully!', { id: `loading-${courseId}` });
        // Navigate using React Router for better SPA experience
        navigate(`/pro-learning/${courseId}`);
      }
    } catch (error) {
      console.error('❌ Error accessing course:', error);
      if (error.response?.status === 404) {
        toast.error('Course not found. It may have been deleted.', { id: `loading-${courseId}` });
        // Refresh the course list
        fetchProCourses();
      } else if (error.response?.status === 401) {
        toast.error('Please log in to access this course.', { id: `loading-${courseId}` });
      } else {
        toast.error('Failed to load course. Please try again.', { id: `loading-${courseId}` });
      }
    }
  };

  const deleteCourse = async (courseId, courseName) => {
    setDeleteLoading(courseId);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/api/courses/pro-learning/${courseId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Remove the deleted course from state
      setProCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      toast.success(`"${courseName}" has been deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting course:', error);
      toast.error('Failed to delete course. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteClick = (course) => {
    console.log('🗑️ Delete button clicked for course:', course.id, course.course_name);
    deleteCourse(course.id, course.course_name);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCourseName = (courseName) => {
    // Remove all AI-related prefixes and clean up the course name
    let cleanName = courseName
      .replace(/^AI Course:\s*/i, '')           // Remove "AI Course: " prefix
      .replace(/^AI Generated Course:\s*/i, '') // Remove "AI Generated Course: " prefix
      .replace(/^AI Generated Course$/i, '')    // Remove standalone "AI Generated Course"
      .replace(/^AI\s+/i, '')                   // Remove "AI " at the beginning
      .trim();
    
    // If the cleaned name is empty or just generic text, provide a fallback
    if (!cleanName || cleanName.toLowerCase() === 'course') {
      return 'Untitled Course';
    }
    
    return cleanName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading your AI-created courses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchProCourses}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (proCourses.length === 0) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-8 text-center">
        <FaBrain className="mx-auto text-4xl text-purple-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No AI Courses Yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first personalized course using our AI-powered course generator
        </p>
        <Link 
          to="/chat"
          className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <FaBrain className="mr-2" />
          Create Your First AI Course
        </Link>
      </div>
    );
  }

  const coursesToDisplay = showMore ? proCourses : proCourses.slice(0, COURSES_TO_SHOW);

  // Debug logging for Load More functionality
  console.log('🔥 [LOAD MORE] Show more state:', showMore);
  console.log('🔥 [LOAD MORE] Total courses available:', proCourses.length);
  console.log('🔥 [LOAD MORE] Courses to display:', coursesToDisplay.length);
  console.log('🔥 [LOAD MORE] Should show Load More button:', proCourses.length > COURSES_TO_SHOW);

  return (
    <>
      {/* Course Grid */}
      <div className="space-y-3 relative z-10">
        {coursesToDisplay.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-purple-200 transition-all duration-200 group relative z-10">
            
            {/* Compact Single Row Layout */}
            <div className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                
                {/* Left: Course Info */}
                <div className="flex items-center flex-1 min-w-0">
                  {/* AI Icon */}
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg mr-3 flex-shrink-0">
                    <FaBrain className="text-white text-sm" />
                  </div>
                  
                  {/* Course Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                      {formatCourseName(course.course_name)}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 space-x-3">
                      <span>Created {formatDate(course.created_at)}</span>
                      <span>•</span>
                      <span className={`${course.is_completed ? 'text-green-600' : 'text-blue-600'}`}>
                        {course.is_completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Progress */}
                <div className="mx-4 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(course.completion_percentage || 0)}`}
                        style={{ width: `${course.completion_percentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-8 text-right">
                      {Math.round(course.completion_percentage || 0)}%
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0 relative z-20">
                  {/* Continue/Start Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Button clicked!', course.id);
                      handleStartCourse(course.id, course.course_name);
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-md text-xs font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center disabled:opacity-50 cursor-pointer relative z-30"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    type="button"
                  >
                    <FaPlay className="mr-1 text-xs" />
                    {course.completion_percentage > 0 ? 'Continue' : 'Start'}
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Delete button clicked!', course.id);
                      handleDeleteClick(course);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 cursor-pointer relative z-30"
                    title="Delete course"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    type="button"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {proCourses.length > COURSES_TO_SHOW && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              console.log('🔥 [LOAD MORE] Button clicked. Current showMore:', showMore);
              console.log('🔥 [LOAD MORE] Total courses:', proCourses.length);
              console.log('🔥 [LOAD MORE] Courses to show initially:', COURSES_TO_SHOW);
              setShowMore(!showMore);
              console.log('🔥 [LOAD MORE] New showMore will be:', !showMore);
            }}
            className="btn-clickable px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md"
            style={{ 
              cursor: 'pointer',
              pointerEvents: 'auto',
              zIndex: 10,
              position: 'relative'
            }}
          >
            {showMore ? 'Show Less' : `Load More (${proCourses.length - COURSES_TO_SHOW} more)`}
          </button>
        </div>
      )}
    </>
  );
};

export default AILearningPlans;