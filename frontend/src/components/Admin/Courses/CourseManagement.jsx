import React, { useState } from 'react';
import CourseForm from './CourseForm';
import CourseList from './CourseList';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { deleteCourse } from '../../../services/courseApi';

const CourseManagement = ({ isDarkMode }) => {
  const [view, setView] = useState('list'); // 'list' or 'add'
  const [refreshKey, setRefreshKey] = useState(0); // For triggering re-fetch
  const navigate = useNavigate();
  
  const handleAddNew = () => {
    navigate('/admin-p/add-course');
  };
  
  const handleEditCourse = (courseId, courseType) => {
    // Show loading toast
    toast.loading('Loading course for editing...', {
      id: 'edit-course-loading',
      style: {
        backgroundColor: isDarkMode ? '#1e40af' : '#3b82f6',
        color: 'white',
      }
    });
    
    // Navigate to edit course page with course ID and type
    navigate(`/admin-p/edit-course/${courseType}/${courseId}`);
  };
  
  const handleDeleteCourse = async (courseId, courseType) => {
    try {
      // Show confirmation dialog
      if (!window.confirm(`Are you sure you want to delete this ${courseType} course? This action cannot be undone.`)) {
        return;
      }
      
      // Show loading toast
      const loadingToast = toast.loading('Deleting course...');
      
      // Call the delete API
      const response = await deleteCourse(courseType, courseId);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (response.success) {
        toast.success(response.message || 'Course deleted successfully', {
          icon: '✅',
          style: {
            backgroundColor: isDarkMode ? '#059669' : '#10b981',
            color: 'white',
          }
        });
        
        // Trigger refresh of course list
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(response.error || 'Failed to delete course', {
          icon: '❌',
          style: {
            backgroundColor: isDarkMode ? '#991b1b' : '#ef4444',
            color: 'white',
          }
        });
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course. Please try again.', {
        icon: '❌',
        style: {
          backgroundColor: isDarkMode ? '#991b1b' : '#ef4444',
          color: 'white',
        }
      });
    }
  };
    return (
    <div className={`p-0 ${isDarkMode ? 'text-white' : ''}`}>
      <div className={`rounded-lg sm:rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-lg'} transition-all`}>
        <CourseList 
          onAddNew={handleAddNew} 
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
          isDarkMode={isDarkMode}
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
};

export default CourseManagement;