import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa';
import axiosInstance from '../../../utils/axios';

const SavedPlaylists = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [learningPlans, setLearningPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's learning plans on component mount
  useEffect(() => {
    fetchUserLearningPlans();
  }, []);
  const fetchUserLearningPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/learning/user-plans/');
      
      // Handle the response format from backend API
      if (response.data && Array.isArray(response.data.plans)) {
        setLearningPlans(response.data.plans);
      } else if (Array.isArray(response.data)) {
        // Fallback if response is directly an array
        setLearningPlans(response.data);
      } else {
        console.warn('Unexpected API response format:', response.data);
        setLearningPlans([]);
      }
    } catch (err) {
      console.error('Error fetching learning plans:', err);
      setError('Failed to load learning plans');
      setLearningPlans([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };
  // Transform learning plans to course format for display
  const courses = Array.isArray(learningPlans) ? learningPlans.map(plan => ({
    id: plan.id,
    title: plan.title,
    instructor: 'AI Generated',
    progress: plan.is_completed ? 100 : 0, // Simple progress calculation
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop',
    duration: `${plan.duration_days} days`,
    difficulty: plan.difficulty_level,
    category: plan.category,
    totalVideos: plan.total_videos,
    daysCount: plan.days_count
  })) : [];

  // Progress Circle Component
  const ProgressCircle = ({ progress }) => {
    const circumference = 2 * Math.PI * 16; // radius = 16
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative w-10 h-10">
        <svg className="transform -rotate-90 w-10 h-10">
          <circle
            className="text-gray-200"
            strokeWidth="2"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="20"
            cy="20"
          />
          <circle
            className="text-blue-600"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="20"
            cy="20"
          />
        </svg>
        {progress === 100 ? (
          <FaCheck className="w-4 h-4 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        ) : (
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-blue-600">
            {progress}%
          </span>
        )}
      </div>
    );
  };

  const favorites = [
    {
      id: 'course-301',
      title: 'Advanced CSS Layouts',
      instructor: 'Lisa Chen',
      thumbnail: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&auto=format&fit=crop',
      rating: 4.8,
      addedOn: '3 weeks ago'
    },
    {
      id: 'course-302',
      title: 'AWS Cloud Practitioner',
      instructor: 'Mark Williams',
      thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop',
      rating: 4.9,
      addedOn: '1 month ago'
    }
  ];

  return (
    <section className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="border-b border-gray-200">        <div className="flex">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'courses'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Learning Plans
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'favorites'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed Plans
          </button>
        </div>
      </div>      <div className="p-6">
        {activeTab === 'courses' ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">My Learning Plans</h2>
              <Link 
                to="/chatbot" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create New Plan
              </Link>
            </div>

            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading learning plans...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {!loading && !error && courses.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Plans Yet</h3>
                <p className="text-gray-600 mb-4">Create your first AI-generated learning plan to get started!</p>
                <Link 
                  to="/chatbot" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Learning Plan
                </Link>
              </div>
            )}

            {!loading && !error && courses.length > 0 && (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div 
                    key={course.id} 
                    className="flex bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow min-h-24"
                  >
                    <div className="w-32">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 px-4 py-3 flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-base mb-1">{course.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{course.instructor}</span>
                          <span>•</span>
                          <span>{course.duration}</span>
                          <span>•</span>
                          <span className="capitalize">{course.difficulty}</span>
                          <span>•</span>
                          <span>{course.totalVideos} videos</span>
                        </div>
                        {course.category && (
                          <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {course.category}
                          </span>
                        )}
                      </div>                      <div className="flex items-center space-x-4">
                        <ProgressCircle progress={course.progress} />
                        <Link 
                          to={`/learning/${course.id}`}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          {course.progress === 100 ? 'Review' : 'Start Learning'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Completed Learning Plans</h2>
              <div className="relative">
                <select className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 px-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option>Recently Completed</option>
                  <option>Difficulty Level</option>
                  <option>A-Z</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading completed plans...</span>
              </div>
            )}

            {!loading && courses.filter(course => course.progress === 100).length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <FaCheck className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Plans Yet</h3>
                <p className="text-gray-600">Complete your learning plans to see them here!</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.filter(course => course.progress === 100).map((course) => (                <div key={course.id} className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <Link to={`/learning/${course.id}`} className="sm:w-1/3">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-32 sm:h-full w-full object-cover"
                      />
                    </Link>
                    <div className="p-4 flex-1 flex flex-col">
                      <Link to={`/learning/${course.id}`} className="hover:text-indigo-600">
                        <h3 className="font-bold mb-1">{course.title}</h3>
                      </Link>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <span>{course.instructor}</span>
                        <span>•</span>
                        <span className="capitalize">{course.difficulty}</span>
                      </div>
                      
                      <div className="flex items-center mt-2">
                        <div className="flex items-center text-green-600">
                          <FaCheck className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto flex justify-between items-center pt-2">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{course.duration}</span>
                          <span>{course.totalVideos} videos</span>
                        </div>                        <Link 
                          to={`/learning/${course.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default SavedPlaylists;