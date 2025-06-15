import React, { useState } from 'react';
import CourseForm from './CourseForm';
import CourseList from './CourseList';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CourseManagement = ({ isDarkMode }) => {
  const [view, setView] = useState('list'); // 'list' or 'add'
  const navigate = useNavigate();
  
  const handleAddNew = () => {
    navigate('/admin-p/add-course');
  };
  
  const handleEditCourse = (courseId, courseType) => {
    // For future implementation
    toast(`Edit ${courseType} course with ID: ${courseId}`, {
      icon: '📝',
      style: {
        backgroundColor: isDarkMode ? '#1e40af' : '#3b82f6',
        color: 'white',
      }
    });
  };
  
  const handleDeleteCourse = (courseId, courseType) => {
    // For future implementation
    toast(`Delete ${courseType} course with ID: ${courseId}`, {
      icon: '🗑️',
      style: {
        backgroundColor: isDarkMode ? '#991b1b' : '#ef4444',
        color: 'white',
      }
    });
  };
    return (
    <div className={`p-0 ${isDarkMode ? 'text-white' : ''}`}>
      <div className={`rounded-lg sm:rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-lg'} transition-all`}>
        <CourseList 
          onAddNew={handleAddNew} 
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default CourseManagement;