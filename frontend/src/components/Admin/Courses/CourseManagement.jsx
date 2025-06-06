import React, { useState } from 'react';
import CourseForm from './CourseForm';
import CourseList from './CourseList';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CourseManagement = () => {
  const [view, setView] = useState('list'); // 'list' or 'add'
  const navigate = useNavigate();
  
  const handleAddNew = () => {
    navigate('/admin-p/add-course');
  };
  
  const handleEditCourse = (courseId) => {
    // For future implementation
    toast.info(`Edit course with ID: ${courseId}`);
  };
  
  const handleDeleteCourse = (courseId) => {
    // For future implementation
    toast.info(`Delete course with ID: ${courseId}`);
  };
  
  return (
    <div className="p-6">
      <CourseList 
        onAddNew={handleAddNew} 
        onEdit={handleEditCourse}
        onDelete={handleDeleteCourse}
      />
    </div>
  );
};

export default CourseManagement;