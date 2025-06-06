import React from 'react';
import { useNavigate } from 'react-router-dom';
import CourseForm from '../Courses/CourseForm';

const AddCoursePage = () => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/admin-p/courses');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Course</h1>
      <CourseForm 
        onCancel={handleCancel} 
      />
    </div>
  );
};

export default AddCoursePage;