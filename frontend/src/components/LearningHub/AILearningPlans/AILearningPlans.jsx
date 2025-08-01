import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaBrain, FaPlay, FaCheckCircle, FaClock, FaChartLine } from 'react-icons/fa';

const API_URL = 'http://localhost:8000';

const AILearningPlans = () => {
  const [proCourses, setProCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {proCourses.map((course) => (
        <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          {/* Course Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                  {course.course_name}
                </h3>
                <p className="text-purple-100 text-sm">
                  Created {formatDate(course.created_at)}
                </p>
              </div>
              <FaBrain className="text-white text-xl ml-2 flex-shrink-0" />
            </div>
          </div>

          {/* Course Content */}
          <div className="p-4">
            {/* Description */}
            {course.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {course.description}
              </p>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-800">
                  {Math.round(course.completion_percentage || 0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(course.completion_percentage || 0)}`}
                  style={{ width: `${course.completion_percentage || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Course Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <FaClock className="mr-1" />
                <span>AI Generated</span>
              </div>
              {course.is_completed ? (
                <div className="flex items-center text-green-600">
                  <FaCheckCircle className="mr-1" />
                  <span>Completed</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <FaChartLine className="mr-1" />
                  <span>In Progress</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link
                to={`/pro-learning/${course.id}`}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <FaPlay className="mr-2 text-xs" />
                {course.completion_percentage > 0 ? 'Continue' : 'Start Course'}
              </Link>
              {course.completion_percentage > 0 && (
                <Link
                  to={`/pro-learning/${course.id}/progress`}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <FaChartLine />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AILearningPlans;