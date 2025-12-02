import React, { memo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import universalToast from '../../../utils/universalToast';
import { getCourseById, updateCourse } from '../../../services/courseApi';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import SchoolCourseEditForm from './SchoolCourseEditForm';
import EngineeringCourseEditForm from './EngineeringCourseEditForm';

const EditCourse = ({ isDarkMode }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const courseData = await getCourseById(courseId);
      setCourse(courseData);
      setError(null);
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course data');
      universalToast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setUpdating(true);
      const response = await updateCourse(courseId, formData);
      
      if (response.success) {
        universalToast.success(response.message || 'Course updated successfully!');
        navigate('/admin-p/courses');
        return true;
      } else {
        throw new Error(response.error || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      universalToast.error(error.message || 'Failed to update course');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin-p/courses');
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading course data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className={`text-6xl mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>⚠️</div>
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Error Loading Course
            </h2>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
            <button
              onClick={() => navigate('/admin-p/courses')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Course not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleCancel}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            } shadow-sm`}
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Edit Course
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Update course information and content
            </p>
          </div>
        </div>

        {/* Form */}
        <div className={`rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {course.course_type === 'school' ? (
            <SchoolCourseEditForm
              course={course}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isUpdating={updating}
              isDarkMode={isDarkMode}
            />
          ) : (
            <EngineeringCourseEditForm
              course={course}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isUpdating={updating}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(EditCourse);
