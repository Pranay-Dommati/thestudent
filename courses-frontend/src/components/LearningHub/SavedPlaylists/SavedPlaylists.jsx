import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaSync } from 'react-icons/fa';
import proContentManager from '../../../services/ProContentManager.js';
import api from '../../../utils/axios';
// logger removed for production cleanliness

const SavedPlaylists = () => {
    const [activeTab, setActiveTab] = useState('courses');
    const [learningPlans, setLearningPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const MAX_RETRIES = 3;

    // Fetch Pro Learning courses from database for current user
    const fetchStoredCourses = useCallback(async (currentRetry = 0) => {
        try {
            setLoading(true);
            setError(null);
            setRetryCount(currentRetry);

            // Ensure user is logged in (axios will attach token if present)
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('Please log in to view your courses');
                setLearningPlans([]);
                return;
            }

            // Fetch courses from database API via axios client
            const { data } = await api.get('/courses/pro-learning/');
            setLearningPlans(Array.isArray(data) ? data : []);
            setRetryCount(0); // Reset retry count on success

        } catch (err) {


            // Retry logic
            if (currentRetry < MAX_RETRIES) {

                setTimeout(() => {
                    fetchStoredCourses(currentRetry + 1);
                }, 1000 * (currentRetry + 1)); // Exponential backoff
            } else {
                const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Failed to load courses. Please check your connection.';
                setError(msg);
                setLearningPlans([]);
            }
        } finally {
            setLoading(false);
        }
    }, [MAX_RETRIES]);

    // Initial fetch on component mount
    useEffect(() => {
        fetchStoredCourses();
    }, [fetchStoredCourses]);

    // Manual retry handler
    const handleRetry = () => {
        setRetryCount(0);
        fetchStoredCourses(0);
    };

    // Helper function to generate course URL with first topic
    const generateCourseUrl = (course) => {
        const rawCourse = course.rawCourse;

        // Check if course has topics and get the first one
        if (rawCourse && rawCourse.topics && rawCourse.topics.length > 0) {
            // Sort topics by order and get the first one
            const sortedTopics = rawCourse.topics.sort((a, b) => (a.order || 0) - (b.order || 0));
            const firstTopic = sortedTopics[0];
            const topicName = encodeURIComponent(firstTopic.topic_name);

            return `/pro-learning/${course.id}?topic=${topicName}&tab=reading`;
        }

        // Fallback if no topics found
        return `/pro-learning/${course.id}`;
    };

    // Transform database courses to display format
    const courses = Array.isArray(learningPlans) ? learningPlans.map(course => {
        // Use database fields directly
        const topicsCount = course.topics_count || 0;
        const progressPercentage = course.completion_percentage || 0;

        return {
            id: course.id,
            title: course.course_name,
            instructor: 'AI Generated',
            progress: Math.round(progressPercentage),
            thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop',
            duration: `${topicsCount} topics`,
            difficulty: 'Beginner',
            category: 'Pro Learning',
            totalVideos: topicsCount * 2, // Estimate based on topics
            daysCount: Math.ceil(topicsCount / 2), // Estimate study days
            rawCourse: course // Keep reference to original course data
        };
    }) : [];

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
        <section className="bg-white rounded-xl shadow-md overflow-hidden max-w-full">
            <div className="border-b border-gray-200">
                <div className="flex flex-col sm:flex-row">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`flex-1 px-3 sm:px-6 py-3 font-medium text-sm focus:outline-none transition-all duration-200 ${activeTab === 'courses'
                                ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                            }`}
                    >
                        <span className="relative">
                            AI Created Courses
                            {activeTab === 'courses' && (
                                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-600 transform scale-x-100 transition-transform"></span>
                            )}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`flex-1 px-3 sm:px-6 py-3 font-medium text-sm focus:outline-none transition-all duration-200 ${activeTab === 'favorites'
                                ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                            }`}
                    >
                        <span className="relative">
                            Completed Courses
                            {activeTab === 'favorites' && (
                                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-600 transform scale-x-100 transition-transform"></span>
                            )}
                        </span>
                    </button>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {activeTab === 'courses' ? (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">AI Created Courses</h2>
                                <p className="text-gray-600 mt-1">Personalized courses generated by artificial intelligence</p>
                            </div>
                            <Link
                                to="/learning-path"
                                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-center shadow-md hover:shadow-lg"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create New Course
                                </span>
                            </Link>
                        </div>

                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <div className="text-gray-600 text-center">
                                    <p className="font-medium">Loading AI created courses...</p>
                                    {retryCount > 0 && (
                                        <p className="text-sm text-gray-500">Retry attempt {retryCount}/{MAX_RETRIES}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-red-700">{error}</p>
                                        <p className="text-sm text-red-600 mt-1">
                                            Please check your internet connection and try again.
                                        </p>
                                    </div>
                                    {error && (
                                        <button
                                            onClick={handleRetry}
                                            className="ml-4 inline-flex items-center px-3 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                        >
                                            <FaSync className="w-4 h-4 mr-2" />
                                            Retry
                                        </button>
                                    )}
                                </div>
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
                                    to="/learning-path"
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
                                        className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex flex-col sm:flex-row">
                                            <div className="relative w-full sm:w-32 h-40 sm:h-auto overflow-hidden">
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent sm:hidden"></div>
                                            </div>
                                            <div className="flex-1 p-4 sm:p-5 flex flex-col">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2 line-clamp-2">
                                                        {course.title}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                                                        <span>{course.instructor}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>{course.duration}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="capitalize">{course.difficulty}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>{course.totalVideos} videos</span>
                                                    </div>
                                                    {course.category && (
                                                        <span className="inline-block px-2 sm:px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                                                            {course.category}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-4 sm:mt-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <ProgressCircle progress={course.progress} />
                                                        <div className="text-sm">
                                                            <div className="font-medium text-gray-900">{course.progress}% Complete</div>
                                                            <div className="text-gray-500 text-xs">
                                                                {Math.round((course.progress / 100) * course.totalVideos)} of {course.totalVideos} lessons
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link
                                                        to={generateCourseUrl(course)}
                                                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg 
                            hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center"
                                                    >
                                                        {course.progress === 100 ? (
                                                            <>
                                                                <span>Review Course</span>
                                                                <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>Continue Learning</span>
                                                                <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </>
                                                        )}
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>) : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Completed Learning Plans</h2>
                            <div className="relative w-full sm:w-auto">
                                <select className="w-full sm:w-auto appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option>Recently Completed</option>
                                    <option>Difficulty Level</option>
                                    <option>A-Z</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {courses.filter(course => course.progress === 100).map((course) => (
                                <div key={course.id} className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row h-full">
                                        <Link to={`/learning-hub/pro-learning?courseId=${course.id}`} className="w-full sm:w-1/3 h-32 sm:h-auto">
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </Link>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <Link to={`/learning-hub/pro-learning?courseId=${course.id}`} className="hover:text-indigo-600">
                                                <h3 className="font-bold text-sm sm:text-base mb-1 line-clamp-2">{course.title}</h3>
                                            </Link>
                                            <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                                                <span>{course.instructor}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="capitalize">{course.difficulty}</span>
                                            </div>

                                            <div className="flex items-center mt-2">
                                                <div className="flex items-center text-green-600">
                                                    <FaCheck className="w-4 h-4 mr-1" />
                                                    <span className="text-xs sm:text-sm font-medium">Completed</span>
                                                </div>
                                            </div>

                                            <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2">
                                                <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                                    <span>{course.duration}</span>
                                                    <span>{course.totalVideos} videos</span>
                                                </div>
                                                <Link
                                                    to={`/learning-hub/pro-learning?courseId=${course.id}`}
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